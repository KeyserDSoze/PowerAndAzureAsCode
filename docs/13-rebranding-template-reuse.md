# Rebranding and template reuse

## Intended use

Create a new repository from this boilerplate and customize the derived product.

Do not turn this generic repository into a customer-specific branch farm.

## Rebrand command

Bash/macOS/Linux:

```bash
npm run rebrand -- \
  --name "Contoso Workspace" \
  --scope "@contoso" \
  --code-owner "@contoso/platform"
```

Windows PowerShell:

```powershell
npm.cmd run rebrand -- --name "Contoso Workspace" --scope "@contoso" --code-owner "@contoso/platform"
```

Use `npm.cmd` on Windows PowerShell for npm scripts that forward arguments after `--`.

The script updates repository-controlled naming such as:

- `brand.config.json`;
- README references;
- web title;
- starter screen;
- Power Pages site-name default;
- npm workspace scope;
- C# project/folder/namespace identifiers;
- Power Platform solution `.cdsproj` references when a derived solution already exists;
- package lockfile package names;
- `.github/CODEOWNERS` when `--code-owner` is supplied.

## What it deliberately does not rename

The script does not modify external resources:

- GitHub repository name;
- Entra app registrations;
- Enterprise Applications;
- Federated Identity Credentials;
- Power Platform environments;
- Dataverse publisher prefixes;
- Dataverse tables/columns;
- existing Power Apps Code App IDs;
- Power Pages site IDs;
- Azure resource names;
- custom domains.

Those resources may already exist and can require migration rather than string replacement.

## Failure recovery and reruns

The script renames filesystem paths **before** editing content and writes `brand.config.json` **last**. That file remains the source of truth for the old name until the rest of the operation completes.

If a rename fails because an editor, terminal or other process holds a directory open:

1. close the locking process;
2. inspect `git status`;
3. if the working tree is disposable or you have saved intentional work, reset it with `git restore . && git clean -fd`;
4. rerun the same rebrand command.

Do not manually edit `brand.config.json` to the new name after a partial failure; doing so removes the old-name source of truth needed by a rerun.

## Recommended derived-repository sequence

1. create repository from template;
2. run rebrand with the owning GitHub user/team;
3. review diff;
4. decide target hosts;
5. initialize Power Apps metadata if required;
6. provision Power Pages/Azure resources if required;
7. configure GitHub Environments;
8. add domain code;
9. deploy DEV;
10. enable selected auto-deploy flags only after proving the pipeline.

## Do not delete host abstractions too early

If a product is expected to be sold in more than one delivery form, keeping the unused host adapter is cheap and preserves the multi-host architecture.

If the product is guaranteed to use only one host, the derived repository may remove unused workflows/adapters after recording that decision.

## Version identity

Rebranding is not a data migration.

If a derived app later stores offline/local data, persistent storage identifiers must be changed only with an explicit migration plan.
