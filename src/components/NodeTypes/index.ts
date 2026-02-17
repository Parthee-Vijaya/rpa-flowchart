import ProcessStepNode from "./ProcessStepNode";
import DecisionNode from "./DecisionNode";
import ApplicationSwitchNode from "./ApplicationSwitchNode";
import DataInputNode from "./DataInputNode";
import BlockerNode from "./BlockerNode";
import StartEndNode from "./StartEndNode";

export const nodeTypes = {
  process_step: ProcessStepNode,
  decision: DecisionNode,
  application_switch: ApplicationSwitchNode,
  data_input: DataInputNode,
  blocker: BlockerNode,
  start_end: StartEndNode,
};

export const nodeTypeLabels: Record<string, { label: string; color: string }> = {
  process_step: { label: "Procestrin", color: "blue" },
  decision: { label: "Beslutning", color: "yellow" },
  application_switch: { label: "Skift app", color: "purple" },
  data_input: { label: "Datainput", color: "green" },
  blocker: { label: "Bloker", color: "red" },
  start_end: { label: "Start/Slut", color: "zinc" },
};
