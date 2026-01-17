# Claude MCP Trello

A Model Context Protocol (MCP) server that provides tools for interacting with Trello boards. This server enables seamless integration with Trello's API while handling rate limiting, type safety, and error handling automatically.

<a href="https://glama.ai/mcp/servers/7vcnchsm63">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/7vcnchsm63/badge" alt="Claude Trello MCP server" />
</a>

## Features

- **Full Trello Board Integration**: Interact with cards, lists, and board activities  
- **Built-in Rate Limiting**: Respects Trello's API limits (300 requests/10s per API key, 100 requests/10s per token)  
- **Type-Safe Implementation**: Written in TypeScript with comprehensive type definitions  
- **Input Validation**: Robust validation for all API inputs  
- **Error Handling**: Graceful error handling with informative messages  

## Available Tools

### `trello_get_cards_by_list`
Retrieves a list of cards contained in the specified list ID.

```typescript
{
  name: "trello_get_cards_by_list",
  arguments: {
    listId: string; // Trello list ID
  }
}
```

### `trello_get_lists`
Retrieves all lists in the specified board.

```typescript
{
  name: "trello_get_lists",
  arguments: {
    boardId: string; // The ID of the Trello board to get lists from
  }
}
```

### `trello_get_recent_activity`
Retrieves the most recent activity for a specified board. The `limit` argument can specify how many to retrieve (default: 10).

```typescript
{
  name: "trello_get_recent_activity",
  arguments: {
    boardId: string; // The ID of the Trello board to get activity from
    limit?: number;  // Optional: number of activities to retrieve
  }
}
```

### `trello_add_card`
Adds a card to the specified list.

```typescript
{
  name: "trello_add_card",
  arguments: {
    listId: string;       // The ID of the list to add to
    name: string;         // The title of the card
    description?: string; // Optional: details of the card
    dueDate?: string;     // Optional: due date (e.g., ISO8601)
    labels?: string[];    // Optional: array of label IDs
  }
}
```

### `trello_update_card`
Updates the content of a card.

```typescript
{
  name: "trello_update_card",
  arguments: {
    cardId: string;       // The ID of the card to be updated
    name?: string;        // Optional: updated title
    description?: string; // Optional: updated description
    dueDate?: string;     // Optional: updated due date (e.g., ISO8601)
    labels?: string[];    // Optional: updated array of label IDs
  }
}
```

### `trello_archive_card`
Archives (closes) the specified card.

```typescript
{
  name: "trello_archive_card",
  arguments: {
    cardId: string; // The ID of the card to archive
  }
}
```

### `trello_add_list`
Adds a new list to the specified board.

```typescript
{
  name: "trello_add_list",
  arguments: {
    boardId: string; // The ID of the Trello board to add the list to
    name: string;    // Name of the new list
  }
}
```

### `trello_archive_list`
Archives (closes) the specified list.

```typescript
{
  name: "trello_archive_list",
  arguments: {
    listId: string; // The ID of the list to archive
  }
}
```

### `trello_get_my_cards`
Retrieves all cards related to your account.

```typescript
{
  name: "trello_get_my_cards",
  arguments: {}
}
```

### `trello_search_all_boards`
Performs a cross-board search across all boards in the workspace (organization), depending on plan/permissions.

```typescript
{
  name: "trello_search_all_boards",
  arguments: {
    query: string;   // Search keyword
    limit?: number;  // Optional: max number of results (default: 10)
  }
}
```

### `trello_get_card_attachments`
Retrieves all attachments from a specified card. Returns attachment metadata including name, file size, MIME type, and URL. Use this to discover what attachments exist on a card before downloading.

```typescript
{
  name: "trello_get_card_attachments",
  arguments: {
    cardId: string;  // The ID of the Trello card to get attachments from
  }
}
```

Returns an array of attachment objects with the following properties:
- `id`: Unique identifier for the attachment
- `name`: Display name of the attachment
- `url`: URL to access/download the attachment
- `bytes`: Size of the attachment in bytes (0 for external links)
- `mimeType`: MIME type (e.g., "image/png", "application/pdf")
- `date`: ISO 8601 date string when the attachment was added
- `isUpload`: Whether this is a Trello upload (true) or external link (false)
- `fileName`: Filename of the attachment

### `trello_download_attachment`
Downloads a specific attachment from a Trello card and saves it locally. For files uploaded directly to Trello, saves to `TRELLO_ATTACHMENT_DIR` and returns the local file path. For external links, returns just the URL.

```typescript
{
  name: "trello_download_attachment",
  arguments: {
    cardId: string;       // The ID of the Trello card containing the attachment
    attachmentId: string; // The ID of the attachment to download
  }
}
```

Returns an object with:
- `attachment`: The full attachment metadata
- `path`: Local file path where the attachment was saved (for Trello uploads) or `null` (for external links)
- `md5`: MD5 hash of the downloaded file (for Trello uploads) or `null`
- `url`: Direct URL to the attachment
- `error`: Error message if download failed (optional)

**Note**: Requires `TRELLO_ATTACHMENT_DIR` environment variable to be set.

**Usage tip**: First use `trello_get_card_attachments` to list all attachments and get their IDs, then use `trello_download_attachment` to download specific files. After reviewing, use `trello_delete_local_attachment` to clean up.

### `trello_delete_local_attachment`
Deletes a locally saved attachment file. For security, only files within the configured `TRELLO_ATTACHMENT_DIR` can be deleted.

```typescript
{
  name: "trello_delete_local_attachment",
  arguments: {
    filePath: string;  // The full path of the local file to delete
  }
}
```

Returns an object with:
- `success`: Boolean indicating if deletion was successful
- `message`: Result message or error description

**Security**: This tool will refuse to delete files outside of `TRELLO_ATTACHMENT_DIR` to prevent accidental deletion of important files.

### `trello_move_card`
Moves a card to a different list.

```typescript
{
  name: "trello_move_card",
  arguments: {
    cardId: string;  // The ID of the card to move
    listId: string;  // The ID of the destination list
  }
}
```

### `trello_add_comment`
Adds a comment to a card.

```typescript
{
  name: "trello_add_comment",
  arguments: {
    cardId: string;  // The ID of the card to comment on
    text: string;    // The comment text
  }
}
```

### `trello_get_labels`
Retrieves all labels on the specified board.

```typescript
{
  name: "trello_get_labels",
  arguments: {
    boardId: string;  // The ID of the Trello board to get labels from
  }
}
```

### `trello_add_label`
Creates a new label on the specified board.

```typescript
{
  name: "trello_add_label",
  arguments: {
    boardId: string;  // The ID of the Trello board to add the label to
    name: string;     // The name of the label
    color: string;    // The color (green, yellow, orange, red, purple, blue, sky, lime, pink, black)
  }
}
```

## Rate Limiting

The server implements a token bucket algorithm for rate limiting to comply with Trello's API limits:
- 300 requests per 10 seconds per API key
- 100 requests per 10 seconds per token

Rate limiting is handled automatically, and requests will be queued if limits are reached.

## Error Handling

The server provides detailed error messages for various scenarios:
- Invalid input parameters
- Rate limit exceeded
- API authentication errors
- Network issues
- Invalid board/list/card IDs

## Development

### Prerequisites

- Node.js 16 or higher  
- npm or yarn  

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/hrs-asano/claude-mcp-trello.git
   cd claude-mcp-trello
   ```

2.	Install dependencies:
   ```bash
   npm install
   ```

3.	Build the project:
   ```bash
   npm run build
   ```

## Running Tests
   ```bash
   npm test
   ```

## Integration with Claude Desktop
To integrate this MCP server with Claude Desktop, add the following configuration to your
~/Library/Application\ Support/Claude/claude_desktop_config.json file:
  ```json
  {
    "mcpServers": {
      "trello": {
        "command": "{YOUR_NODE_PATH}", // for example: /opt/homebrew/bin/node
        "args": [
          "{YOUR_PATH}/claude-mcp-trello/build/index.js"
        ],
        "env": {
          "TRELLO_API_KEY": "{YOUR_KEY}",
          "TRELLO_TOKEN": "{YOUR_TOKEN}",
          "TRELLO_ATTACHMENT_DIR": "{YOUR_PROJECT}/tmp"
        }
      }
    }
  }
  ```

Make sure to replace {YOUR_NODE_PATH}, {YOUR_PATH}, {YOUR_KEY}, {YOUR_TOKEN}, and {YOUR_PROJECT} with the appropriate values for your environment.

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `TRELLO_API_KEY` | Yes | Your Trello API key |
| `TRELLO_TOKEN` | Yes | Your Trello API token |
| `TRELLO_ATTACHMENT_DIR` | No | Directory to save downloaded attachments. Required for `trello_download_attachment` and `trello_delete_local_attachment` tools. |

**Note:** Board IDs are passed as parameters to individual tools rather than configured globally, allowing you to work with multiple boards.

## Contributing
Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments
- Built with the [Model Context Protocol SDK](https://github.com/modelcontextprotocol)
- Uses the [Trello REST API](https://developer.atlassian.com/cloud/trello/rest/)