import { NextResponse } from "next/server";
import { writeFileSync, readFileSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { query } from "@anthropic-ai/claude-agent-sdk";
import {
  createFinancialMcpServer,
  allMcpToolNames,
} from "@/mcp/financial-server";
import {
  buildTaskPrompt,
  getTaskConfig,
  subAgentConfigs,
  type AgentTaskType,
} from "@/lib/agent-tasks";
import {
  computeDiffs,
  type AgentDataSnapshot,
} from "@/lib/agent-data";

export const maxDuration = 120;

interface BackgroundAgentRequest {
  task: AgentTaskType;
  dataSnapshot: AgentDataSnapshot;
  goalIds?: string[];
}

// Helper to format an SSE event
function sseEvent(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as BackgroundAgentRequest;
    const { task, dataSnapshot, goalIds } = body;

    // Validate task type
    const taskConfig = getTaskConfig(task);
    if (!taskConfig) {
      return NextResponse.json(
        { error: `Unknown task type: ${task}` },
        { status: 400 },
      );
    }

    // Write snapshot to temp file
    const tempId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const tempFilePath = join(tmpdir(), `neocash-agent-${tempId}.json`);
    writeFileSync(tempFilePath, JSON.stringify(dataSnapshot, null, 2), "utf-8");

    // Create in-process MCP server backed by temp file
    const mcpServer = createFinancialMcpServer(tempFilePath);

    // Build orchestrator prompt
    const orchestratorPrompt = buildTaskPrompt(task, goalIds);

    // Build sub-agent definitions
    type AgentModel = "sonnet" | "opus" | "haiku" | "inherit";
    const agents: Record<string, {
      description: string;
      prompt: string;
      tools: string[];
      model?: AgentModel;
    }> = {};

    const knownAgentNames = new Set(taskConfig.subAgents);

    for (const agentName of taskConfig.subAgents) {
      const config = subAgentConfigs[agentName];
      if (config) {
        agents[agentName] = {
          description: config.description,
          prompt: config.prompt,
          tools: config.tools,
          model: config.model as AgentModel | undefined,
        };
      }
    }

    // Strip CLAUDECODE env var to prevent "cannot launch inside another Claude Code
    // session" error when the dev server runs inside a Claude Code terminal.
    const cleanEnv: Record<string, string | undefined> = {};
    for (const key of Object.keys(process.env)) {
      if (key !== "CLAUDECODE") {
        cleanEnv[key] = process.env[key];
      }
    }

    // Track per-agent start times for duration calculation
    const agentStartTimes = new Map<string, number>();
    // Debounce progress events per agent (500ms)
    const lastProgressTime = new Map<string, number>();
    const PROGRESS_DEBOUNCE_MS = 500;

    // SSE stream
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          let resultText = "";

          for await (const message of query({
            prompt: orchestratorPrompt,
            options: {
              model: "sonnet",
              systemPrompt: `You are a financial analysis orchestrator. You coordinate specialist sub-agents to perform comprehensive financial analysis. Use the provided MCP tools to read and write the user's financial data. Delegate domain-specific analysis to the appropriate sub-agent using the Task tool. Synthesize findings into a clear, actionable summary.`,
              mcpServers: {
                "neocash-financial": mcpServer,
              },
              allowedTools: [
                ...allMcpToolNames,
                "Task", // Required for sub-agent delegation
              ],
              maxTurns: 20,
              agents,
              env: cleanEnv,
            },
          })) {
            const msg = message as Record<string, unknown>;

            // Match agent name from message description against known sub-agents
            const matchAgentName = (desc?: string): string | null => {
              if (!desc) return null;
              for (const name of knownAgentNames) {
                if (desc.toLowerCase().includes(name.toLowerCase())) return name;
              }
              return null;
            };

            // Handle different message types from the Agent SDK
            if (msg.type === "agent") {
              const subtype = msg.subtype as string | undefined;
              const description = (msg.description as string) || "";
              const agentName = matchAgentName(description);

              if (subtype === "task_started" && agentName) {
                agentStartTimes.set(agentName, Date.now());
                controller.enqueue(
                  encoder.encode(
                    sseEvent("agent:started", {
                      taskId: (msg.taskId as string) || agentName,
                      agentName,
                      description,
                      total: taskConfig.subAgents.length,
                    }),
                  ),
                );
              } else if (subtype === "task_progress" && agentName) {
                // Debounce progress events
                const now = Date.now();
                const last = lastProgressTime.get(agentName) || 0;
                if (now - last >= PROGRESS_DEBOUNCE_MS) {
                  lastProgressTime.set(agentName, now);
                  controller.enqueue(
                    encoder.encode(
                      sseEvent("agent:progress", {
                        taskId: (msg.taskId as string) || agentName,
                        agentName,
                        description,
                        lastTool: (msg.toolName as string) || undefined,
                      }),
                    ),
                  );
                }
              } else if (subtype === "task_notification" && agentName) {
                const status = (msg.status as string) || "";
                const startTime = agentStartTimes.get(agentName);
                const durationMs = startTime ? Date.now() - startTime : 0;

                if (status === "completed" || status === "success") {
                  controller.enqueue(
                    encoder.encode(
                      sseEvent("agent:completed", {
                        taskId: (msg.taskId as string) || agentName,
                        agentName,
                        summary: (msg.summary as string) || description,
                        durationMs,
                      }),
                    ),
                  );
                } else {
                  controller.enqueue(
                    encoder.encode(
                      sseEvent("agent:error", {
                        taskId: (msg.taskId as string) || agentName,
                        agentName,
                        summary: (msg.summary as string) || description,
                      }),
                    ),
                  );
                }
              }
            }

            // Collect the final result
            if (
              msg.type === "result" &&
              (msg.subtype as string) === "success"
            ) {
              resultText = (msg.result as string) || "";
            }
          }

          // Compute diffs and send final result
          const modifiedRaw = readFileSync(tempFilePath, "utf-8");
          const modifiedSnapshot = JSON.parse(modifiedRaw) as AgentDataSnapshot;
          const diffs = computeDiffs(dataSnapshot, modifiedSnapshot);

          // Cleanup temp file
          try {
            unlinkSync(tempFilePath);
          } catch {
            // Ignore cleanup errors
          }

          const changeCount =
            diffs.goals.created.length +
            diffs.goals.updated.length +
            diffs.goals.deleted.length +
            diffs.memories.created.length +
            diffs.memories.updated.length +
            diffs.memories.deleted.length +
            diffs.signals.created.length;

          controller.enqueue(
            encoder.encode(
              sseEvent("agent:result", {
                diffs,
                summary: resultText,
                changeCount,
                task,
              }),
            ),
          );

          controller.close();
        } catch (error) {
          console.error("[background-agent] Stream error:", error);

          // Try to cleanup temp file
          try {
            unlinkSync(tempFilePath);
          } catch {
            // Ignore
          }

          controller.enqueue(
            encoder.encode(
              sseEvent("agent:error", {
                taskId: "orchestrator",
                agentName: "orchestrator",
                summary:
                  error instanceof Error
                    ? error.message
                    : "Background agent failed",
              }),
            ),
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("[background-agent] Error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Background agent failed",
      },
      { status: 500 },
    );
  }
}
