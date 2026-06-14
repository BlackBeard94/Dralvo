// Alert Condition
// Flexible JSONB structure stored in condition_json column.
// Examples:
//   { "operator": "gt", "value": 70 }          => RSI > 70
//   { "operator": "lt", "value": 30 }          => RSI < 30
//   { "operator": "cross_above", "value": 50 } => crosses above 50
//   { "operator": "cross_below", "value": 50 } => crosses below 50
//   { "operator": "between", "min": 30, "max": 70 } => between 30-70

export type AlertOperator =
  | "gt"
  | "lt"
  | "gte"
  | "lte"
  | "eq"
  | "cross_above"
  | "cross_below"
  | "between"
  | "state_is";

export type MonitorState =
  | "supportive"
  | "confirming"
  | "diverging"
  | "mixed"
  | "adverse"
  | "neutral"
  | "insufficient_data"
  | "missing"
  | "stale";

export type AlertCondition = {
  operator: AlertOperator;
  value?: number;
  min?: number;
  max?: number;
  state?: MonitorState;
};

export type Alert = {
  id: string;
  user_id: string;
  indicator_key: string;
  condition_json: AlertCondition;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type CreateAlertInput = {
  indicator_key: string;
  condition_json: AlertCondition;
  active?: boolean;
};

export type UpdateAlertInput = {
  indicator_key?: string;
  condition_json?: AlertCondition;
  active?: boolean;
};

export const OPERATOR_LABELS: Record<AlertOperator, string> = {
  gt: ">",
  lt: "<",
  gte: ">=",
  lte: "<=",
  eq: "=",
  cross_above: "crosses above",
  cross_below: "crosses below",
  between: "between",
  state_is: "state is",
};

export const OPERATOR_OPTIONS: { value: AlertOperator; label: string }[] = [
  { value: "gt", label: "Greater than (>)" },
  { value: "lt", label: "Less than (<)" },
  { value: "gte", label: "Greater than or equal (>=)" },
  { value: "lte", label: "Less than or equal (<=)" },
  { value: "eq", label: "Equal to (=)" },
  { value: "cross_above", label: "Crosses above" },
  { value: "cross_below", label: "Crosses below" },
  { value: "between", label: "Between" },
  { value: "state_is", label: "State is" },
];

export function formatCondition(condition: AlertCondition): string {
  if (condition.operator === "state_is") {
    return `state is ${condition.state?.replace("_", " ") ?? "not set"}`;
  }
  if (condition.operator === "between") {
    return `${condition.min} - ${condition.max}`;
  }
  if (condition.operator === "cross_above" || condition.operator === "cross_below") {
    return `${OPERATOR_LABELS[condition.operator]} ${condition.value}`;
  }
  return `${OPERATOR_LABELS[condition.operator]} ${condition.value}`;
}
