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
Downloads a specific attachment from a Trello card. For files uploaded directly to Trello, returns the content as base64-encoded data. For external links, returns the URL.

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
- `content`: Base64-encoded file content (for Trello uploads) or `null` (for external links)
- `url`: Direct URL to the attachment

**Usage tip**: First use `trello_get_card_attachments` to list all attachments and get their IDs, then use `trello_download_attachment` to download specific files.

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
          "TRELLO_TOKEN": "{YOUR_TOKEN}"
        }
      }
    }
  }
  ```

Make sure to replace {YOUR_NODE_PATH}, {YOUR_PATH}, {YOUR_KEY}, and {YOUR_TOKEN} with the appropriate values for your environment.

**Note:** Board IDs are passed as parameters to individual tools rather than configured globally, allowing you to work with multiple boards.

## Contributing
Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments
- Built with the [Model Context Protocol SDK](https://github.com/modelcontextprotocol)
- Uses the [Trello REST API](https://developer.atlassian.com/cloud/trello/rest/)