import { getWorkspace } from "../workspace/getWorkspace";
import { logger } from "../logger";
import { Config } from "../types/Config";
import { generateTopologicGraph } from "../workspace/generateTopologicalGraph";
import { signal } from "../task/abortSignal";
import { killAllActiveProcesses } from "../task/npmTask";
import { displayReportAndExit } from "../displayReportAndExit";
import { createContext } from "../context";
import { runTasks } from "../task/taskRunner";

// Create context
export async function run(cwd: string, config: Config) {
  const context = createContext(config);
  const workspace = getWorkspace(cwd, config);

  // generate topological graph
  const graph = generateTopologicGraph(workspace);

  const { profiler } = context;
  context.measures.start = process.hrtime();

  // die faster if an abort signal is seen
  signal.addEventListener("abort", () => {
    killAllActiveProcesses();
    displayReportAndExit(context);
  });

  try {
    await runTasks({ graph, workspace, context, config });
  } catch (e) {
    logger.error("runTasks", e);
  }

  if (config.profile) {
    const profileFile = profiler.output();
    logger.info("runTasks", `Profile saved to ${profileFile}`);
  }

  displayReportAndExit(context);
}
