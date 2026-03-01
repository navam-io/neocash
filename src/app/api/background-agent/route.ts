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
  type AgentDataDiff,
} from "@/lib/agent-data";

export const maxDuration = 120;

interface BackgroundAgentRequest {
  task: AgentTaskType;
  dataSnapshot: AgentDataSnapshot;
  goalIds?: string[];
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

    // Run Agent SDK query
    let resultText = "";

    for await (const message of query({
      prompt: orchestratorPrompt,
      options: {
        model: "claude-sonnet-4-5-20250514",
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
      },
    })) {
      // Collect the final result
      if (
        message.type === "result" &&
        (message as { subtype?: string }).subtype === "success"
      ) {
        resultText = (message as { result?: string }).result || "";
      }
    }

    // Read modified snapshot and compute diffs
    const modifiedRaw = readFileSync(tempFilePath, "utf-8");
    const modifiedSnapshot = JSON.parse(modifiedRaw) as AgentDataSnapshot;
    const diffs = computeDiffs(dataSnapshot, modifiedSnapshot);

    // Cleanup temp file
    try {
      unlinkSync(tempFilePath);
    } catch {
      // Ignore cleanup errors
    }

    // Count changes for summary
    const changeCount =
      diffs.goals.created.length +
      diffs.goals.updated.length +
      diffs.goals.deleted.length +
      diffs.memories.created.length +
      diffs.memories.updated.length +
      diffs.memories.deleted.length +
      diffs.signals.created.length;

    return NextResponse.json({
      diffs,
      summary: resultText,
      changeCount,
      task,
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
