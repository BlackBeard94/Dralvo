import type { IndicatorSnapshot } from "@/data/indicators";
import { extractIndicatorNumericValue } from "@/lib/indicator-values";
import type { AlertCondition } from "@/types/alerts";

export function extractNumericValue(snapshot: IndicatorSnapshot): number | null {
  return extractIndicatorNumericValue(snapshot);
}

export function evaluateCondition(
  currentValue: number,
  condition: AlertCondition,
  previousValue?: number,
): boolean {
  const { operator, value, min, max } = condition;

  switch (operator) {
    case "gt":
      return value !== undefined && currentValue > value;
    case "lt":
      return value !== undefined && currentValue < value;
    case "gte":
      return value !== undefined && currentValue >= value;
    case "lte":
      return value !== undefined && currentValue <= value;
    case "eq":
      return value !== undefined && currentValue === value;
    case "between":
      return (
        min !== undefined &&
        max !== undefined &&
        currentValue >= min &&
        currentValue <= max
      );
    case "cross_above":
      if (previousValue === undefined || value === undefined) return false;
      return previousValue <= value && currentValue > value;
    case "cross_below":
      if (previousValue === undefined || value === undefined) return false;
      return previousValue >= value && currentValue < value;
    default:
      return false;
  }
}

export function needsPreviousValue(condition: AlertCondition): boolean {
  return condition.operator === "cross_above" || condition.operator === "cross_below";
}

export function evaluateStateCondition(
  currentState: string,
  condition: AlertCondition,
): boolean {
  return condition.operator === "state_is" && currentState === condition.state;
}
