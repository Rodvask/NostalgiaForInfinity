"""Static guards for wiring defects that no runtime test would catch.

Two bug families found while auditing the strategy, guarded here:

  1. Reads of `self.<name>` that the class never defines — a renamed or missing knob:
     `self.system_v4_2_*` (leftover from a "v4_2" rename, the family does not exist) and
     `self.short_grind_mode_name` (defined for the long side as `long_grind_mode_name`, missing
     on the short side). Both would raise `AttributeError` the moment their code path runs.

  2. Futures/spot ternaries whose two branches are textually identical: the futures knob is
     never read, so the config knob is inert and one of the two names is dead. That is how
     `grind_mode_first_entry_profit_threshold_futures` / `..._stop_threshold_futures` were
     silently ignored (the spot values were used in both modes).

The local-variable variant of family 1 lives in `test_NFIX8_scope_guard.py`.

Caveat for family 1: a name is accepted if it is a class attribute, assigned via `self.x = ...`
anywhere, provided by freqtrade's `IStrategy`, passed to `setattr(self, ...)`, or appears as a
string literal that looks like a strategy parameter (the config can inject any of those through
`nfi_parameters`). A read that is *also* a string literal elsewhere is therefore not flagged.
"""

import ast
import re
from pathlib import Path

STRATEGY_PATH = Path(__file__).parents[2] / "NostalgiaForInfinityX8.py"

# freqtrade sets these on the strategy *instance*, so they are not in dir(IStrategy)
FREQTRADE_INSTANCE_ATTRS = {
  "dp",
  "wallets",
  "exchange",
  "pairlists",
  "config",
  "exit_profit_offset",
  "position_adjustment_enable",
  "custom_info",
}


def _strategy_attributes(source):
  """Every `self.<name>` read that the class cannot possibly resolve."""
  tree = ast.parse(source)
  known = set()
  for node in ast.walk(tree):
    if isinstance(node, ast.ClassDef):
      for stmt in node.body:
        if isinstance(stmt, ast.Assign):
          for target in stmt.targets:
            if isinstance(target, ast.Name):
              known.add(target.id)
        if isinstance(stmt, ast.AnnAssign) and isinstance(stmt.target, ast.Name):
          known.add(stmt.target.id)
    if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
      known.add(node.name)
    if (
      isinstance(node, ast.Attribute)
      and isinstance(node.ctx, ast.Store)
      and isinstance(node.value, ast.Name)
      and node.value.id == "self"
    ):
      known.add(node.attr)

  from freqtrade.strategy import IStrategy

  known |= {name for name in dir(IStrategy) if not name.startswith("__")}
  known |= FREQTRADE_INSTANCE_ATTRS
  for match in re.finditer(r'(?:setattr|getattr)\(\s*self\s*,\s*([a-zA-Z_"\']+)', source):
    known.add(match.group(1).strip("\"'"))
  known |= {
    name
    for name in re.findall(r'"([a-z_][a-z0-9_]*)"', source)
    if name.startswith(("system_", "nfi_", "grind_", "derisk_"))
  }

  problems = []
  for node in ast.walk(tree):
    if (
      isinstance(node, ast.Attribute)
      and isinstance(node.ctx, ast.Load)
      and isinstance(node.value, ast.Name)
      and node.value.id == "self"
      and node.attr not in known
    ):
      problems.append((node.lineno, node.attr))
  return problems


def _identical_futures_spot_ternaries(source):
  """futures/spot ternaries whose two branches are textually identical."""
  tree = ast.parse(source)
  problems = []
  for node in ast.walk(tree):
    if not isinstance(node, ast.IfExp):
      continue
    if not re.search(r"futures|spot", ast.unparse(node.test), re.I):
      continue
    body = ast.unparse(node.body)
    orelse = ast.unparse(node.orelse)
    if body == orelse and len(body) > 8:
      problems.append((node.lineno, body[:100]))
  return problems


def test_no_undefined_strategy_attributes():
  source = STRATEGY_PATH.read_text(encoding="utf-8")
  problems = _strategy_attributes(source)
  lines = source.splitlines()
  details = "\n".join(f"  line {ln}: `self.{name}` — {lines[ln - 1].strip()[:100]}" for ln, name in sorted(problems))
  assert not problems, f"reads of attributes the strategy never defines:\n{details}"


def test_no_identical_futures_spot_ternaries():
  source = STRATEGY_PATH.read_text(encoding="utf-8")
  problems = _identical_futures_spot_ternaries(source)
  details = "\n".join(f"  line {ln}: both branches are `{body}`" for ln, body in sorted(problems))
  assert not problems, "futures/spot ternaries with identical branches — one knob is never read:\n" + details
