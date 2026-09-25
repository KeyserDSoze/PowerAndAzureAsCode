# ADR 0001: One frontend, multiple host adapters

Status: Accepted

## Context

The same product may be delivered through Power Apps, Power Pages or Azure. Forking the UI would multiply maintenance and allow behavior to diverge.

## Decision

Maintain one React/TypeScript feature/UI codebase.

Host-specific identity, transport and capabilities are accessed through explicit adapter interfaces.

Separate builds are allowed and expected. "Same frontend" means same source/product behavior, not necessarily byte-identical bundles.

## Consequences

Positive:

- one UX/domain implementation;
- host differences remain visible and testable;
- products can add/remove delivery channels with lower cost.

Negative:

- adapter contracts require discipline;
- lowest-common-denominator design must be avoided by exposing explicit capabilities where necessary.
