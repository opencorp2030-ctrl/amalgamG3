# amalgamG3 + Claude

Lets Claude manage an amalgamG3 merchant account directly: create and edit verification buttons
("apps"), fetch their embeddable HTML code, and update the merchant profile — all scoped to a
single merchant account via a private link/key. It never has access to the admin panel or to
other merchants'/individuals' accounts.

There are two ways to connect. **Most merchants should use the first one** — no install, no
terminal, just a link.

## Option A — Remote connector (recommended, no install)

1. Log in to your amalgamG3 merchant account: https://amalgam.candygate.eu/login.html
2. Go to the **IA & MCP** tab
3. Click **Générer mon lien** and copy the link shown — it is only ever shown once.
4. On [claude.ai](https://claude.ai) (or the Claude app) → **Settings** → **Connectors** →
   **Add custom connector** → paste the link → save.
5. Ask Claude things like *"create a verification button for 18+ entry and give me the code to
   add to my site"* or *"list my verification buttons"*.

That's it — nothing to install, nothing to run locally.

## Option B — Local server (advanced, for Claude Code / Claude Desktop)

If you'd rather run a local server (e.g. to use it from Claude Code):

1. Get an API key the same way as above, but from the classic key display if shown, or reuse the
   link from Option A — the part after the last `/` is the raw key.
2. Install:
   ```bash
   cd mcp-server
   npm install
   ```
3. **Claude Code**:
   ```bash
   claude mcp add amalgamg3 --env AMALGAMG3_API_KEY=amg3_your_key_here -- node mcp-server/index.js
   ```
   **Claude Desktop** (`claude_desktop_config.json`):
   ```json
   {
     "mcpServers": {
       "amalgamg3": {
         "command": "node",
         "args": ["/absolute/path/to/amalgamG3/mcp-server/index.js"],
         "env": { "AMALGAMG3_API_KEY": "amg3_your_key_here" }
       }
     }
   }
   ```

## Available tools

- `get_merchant_profile` / `update_merchant_profile`
- `list_verification_buttons`
- `create_verification_button`
- `update_verification_button`
- `delete_verification_button`
- `get_button_embed_code`

## Security

- The key/link only grants access to the one merchant account it belongs to — never to admin
  data or other accounts.
- Regenerating it from the site immediately invalidates the old one.
- Keep it secret, the same way you would an API key or a password.