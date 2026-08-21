# Harbor interoperability

RLViz and Harbor have complementary boundaries. Harbor owns running,
uploading, and browsing jobs. RLViz reads a local Harbor job directory as a
complete run and can turn selected evidence into an explicitly shared,
digest-pinned bundle. This catalog links the two without becoming another
runner or silently copying Hub data.

## Link contract

Harbor documents uploaded jobs and trials as shareable Hub objects with public,
private, organization, and user visibility. It also supports downloading a
whole job or one trial by ID. See Harbor's [sharing
documentation](https://github.com/harbor-framework/harbor/blob/71180a2e6fb40626b661c13f261b1d44517ad91a/docs/content/docs/sharing/jobs.mdx).

Job links use:

```text
https://hub.harborframework.com/jobs/<job-id>
```

Short trial links of the following form were publicly reachable on 2026-08-20:

```text
https://hub.harborframework.com/jobs/<job-id>/trials/<trial-id>
```

They are useful live pointers, but RLViz must not synthesize or treat them as
immutable evidence. Harbor's current viewer source declares a more detailed
task-scoped trial route, while the production short route remains reachable.
That difference is enough reason to preserve only a source-provided URL. See
the pinned [viewer route
definition](https://github.com/harbor-framework/harbor/blob/71180a2e6fb40626b661c13f261b1d44517ad91a/apps/viewer/app/routes.ts)
and a public [short trial-link
example](https://github.com/harbor-framework/harbor/issues/2228).

Hub objects can also change visibility or be deleted. A checked Hub URL proves
availability at a point in time; it does not prove lasting availability or
content identity.

## Catalog rules

- Store a Harbor job or trial URL only when an upstream record provides it.
- Record when public availability was checked, and keep an explicit unavailable
  state when the Hub object disappears.
- Do not derive a trial URL from names or incomplete metadata.
- Do not mirror Hub content unless its redistribution rights and complete
  provenance independently pass the publication boundary.
- Use a reviewed `.rlviz` bundle plus its full SHA-256 when evidence must remain
  portable and content-addressed.
- Opening a catalog link or RLViz handoff remains an explicit user action.

The current Harbor-Index submission demonstrates the failure mode: its pinned
source record remains useful after the declared Hub job stopped being publicly
reachable.
