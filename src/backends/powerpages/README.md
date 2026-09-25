# Power Pages server-side adapter templates

This folder contains generic Server Logic source templates. It is **not** the folder uploaded directly by Power Pages.

For a Code Site, deployable server-side metadata belongs inside the site project:

```text
src/frontend/.powerpages-site/server-logic/<name>/
  <name>.js
  <name>.serverlogic.yml
```

The `.powerpages-site` folder is created/populated by the Power Pages Code Site lifecycle after the site is first deployed or downloaded. It also contains environment/site metadata such as web roles and table permissions.

## Install an example after the first site bootstrap

Health endpoint:

```bash
node scripts/install-powerpages-server-logic-example.mjs \
  --name health \
  --web-role-name "Authenticated Users"
```

Dataverse Custom API façade:

```bash
node scripts/install-powerpages-server-logic-example.mjs \
  --name boilerplate-ping \
  --web-role-name "Authenticated Users" \
  --publisher-prefix abc
```

The installer:

- resolves the selected web-role GUID from `src/frontend/.powerpages-site/web-roles`, or accepts an explicit role GUID;
- creates a stable Server Logic record GUID;
- copies the reviewed JavaScript template;
- writes the required `.serverlogic.yml` metadata;
- replaces the placeholder publisher prefix for the Dataverse example.

Commit the generated `.powerpages-site` files. The existing `pac pages upload-code-site` workflow then deploys Server Logic together with the Code Site.

Do not copy web-role or site GUIDs from another environment. Bootstrap/download the actual site's metadata first.
