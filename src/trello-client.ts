import axios, { AxiosInstance } from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { TrelloConfig, TrelloCard, TrelloList, TrelloAction, TrelloMember, TrelloAttachment, TrelloLabel } from './types.js';
import { createTrelloRateLimiters } from './rate-limiter.js';

export class TrelloClient {
  private axiosInstance: AxiosInstance;
  private rateLimiter;

  constructor(private config: TrelloConfig) {
    this.axiosInstance = axios.create({
      baseURL: 'https://api.trello.com/1',
      params: {
        key: config.apiKey,
        token: config.token,
      },
    });

    this.rateLimiter = createTrelloRateLimiters();

    // Add rate limiting interceptor
    this.axiosInstance.interceptors.request.use(async (config) => {
      await this.rateLimiter.waitForAvailable();
      return config;
    });
  }

  private async handleRequest<T>(request: () => Promise<T>): Promise<T> {
    try {
      return await request();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 429) {
          // Rate limit exceeded, wait and retry
          await new Promise(resolve => setTimeout(resolve, 1000));
          return this.handleRequest(request);
        }
        throw new Error(`Trello API error: ${error.response?.data?.message ?? error.message}`);
      }
      throw error;
    }
  }

  async getCardsByList(listId: string): Promise<TrelloCard[]> {
    return this.handleRequest(async () => {
      const response = await this.axiosInstance.get(`/lists/${listId}/cards`);
      return response.data;
    });
  }

  /**
   * Retrieves all lists for a specific board.
   *
   * @param boardId - The ID of the board to get lists from
   * @returns Promise resolving to an array of TrelloList objects
   */
  async getLists(boardId: string): Promise<TrelloList[]> {
    return this.handleRequest(async () => {
      const response = await this.axiosInstance.get(`/boards/${boardId}/lists`);
      return response.data;
    });
  }

  /**
   * Retrieves recent activity for a specific board.
   *
   * @param boardId - The ID of the board to get activity from
   * @param limit - Maximum number of activities to retrieve (default: 10)
   * @returns Promise resolving to an array of TrelloAction objects
   */
  async getRecentActivity(boardId: string, limit: number = 10): Promise<TrelloAction[]> {
    return this.handleRequest(async () => {
      const response = await this.axiosInstance.get(`/boards/${boardId}/actions`, {
        params: { limit },
      });
      return response.data;
    });
  }

  async addCard(params: {
    listId: string;
    name: string;
    description?: string;
    dueDate?: string;
    labels?: string[];
  }): Promise<TrelloCard> {
    return this.handleRequest(async () => {
      const response = await this.axiosInstance.post('/cards', {
        idList: params.listId,
        name: params.name,
        desc: params.description,
        due: params.dueDate,
        idLabels: params.labels,
      });
      return response.data;
    });
  }

  async updateCard(params: {
    cardId: string;
    name?: string;
    description?: string;
    dueDate?: string;
    labels?: string[];
  }): Promise<TrelloCard> {
    return this.handleRequest(async () => {
      const response = await this.axiosInstance.put(`/cards/${params.cardId}`, {
        name: params.name,
        desc: params.description,
        due: params.dueDate,
        idLabels: params.labels,
      });
      return response.data;
    });
  }

  async archiveCard(cardId: string): Promise<TrelloCard> {
    return this.handleRequest(async () => {
      const response = await this.axiosInstance.put(`/cards/${cardId}`, {
        closed: true,
      });
      return response.data;
    });
  }

  /**
   * Adds a new list to a specific board.
   *
   * @param boardId - The ID of the board to add the list to
   * @param name - The name of the new list
   * @returns Promise resolving to the created TrelloList object
   */
  async addList(boardId: string, name: string): Promise<TrelloList> {
    return this.handleRequest(async () => {
      const response = await this.axiosInstance.post('/lists', {
        name,
        idBoard: boardId,
      });
      return response.data;
    });
  }

  async archiveList(listId: string): Promise<TrelloList> {
    return this.handleRequest(async () => {
      const response = await this.axiosInstance.put(`/lists/${listId}/closed`, {
        value: true,
      });
      return response.data;
    });
  }

  async getMyCards(): Promise<TrelloCard[]> {
    return this.handleRequest(async () => {
      const response = await this.axiosInstance.get('/members/me/cards');
      return response.data;
    });
  }

  async searchAllBoards(query: string, limit: number = 10): Promise<any> {
    return this.handleRequest(async () => {
      const response = await this.axiosInstance.get('/search', {
        params: {
          query,
          modelTypes: 'all',
          boards_limit: limit,
          cards_limit: limit,
          organization: true,
        },
      });
      return response.data;
    });
  }

  /**
   * Retrieves all attachments for a specific card.
   *
   * @param cardId - The ID of the card to get attachments from
   * @returns Promise resolving to an array of TrelloAttachment objects
   *
   * @example
   * const attachments = await client.getCardAttachments('abc123');
   * console.log(attachments.map(a => a.name));
   */
  async getCardAttachments(cardId: string): Promise<TrelloAttachment[]> {
    return this.handleRequest(async () => {
      const response = await this.axiosInstance.get(`/cards/${cardId}/attachments`);
      return response.data;
    });
  }

  /**
   * 添付ファイルをダウンロードしてローカルに保存する。
   *
   * @param cardId - カードID
   * @param attachmentId - 添付ファイルID
   * @returns Promise resolving to an object containing:
   *   - attachment: 添付ファイルのメタデータ
   *   - path: 保存先のファイルパス（TRELLO_ATTACHMENT_DIR設定時のみ）
   *   - md5: ファイルのMD5ハッシュ（保存成功時のみ）
   *   - url: 添付ファイルのURL
   */
  async downloadAttachment(cardId: string, attachmentId: string): Promise<{
    attachment: TrelloAttachment;
    path: string | null;
    md5: string | null;
    url: string;
    error?: string;
  }> {
    return this.handleRequest(async () => {
      const metadataResponse = await this.axiosInstance.get(
        `/cards/${cardId}/attachments/${attachmentId}`
      );
      const attachment: TrelloAttachment = metadataResponse.data;

      if (!attachment.isUpload) {
        return {
          attachment,
          path: null,
          md5: null,
          url: attachment.url,
        };
      }

      if (!this.config.attachmentDir) {
        return {
          attachment,
          path: null,
          md5: null,
          url: attachment.url,
          error: 'TRELLO_ATTACHMENT_DIR is not set',
        };
      }

      try {
        const contentResponse = await axios.get(attachment.url, {
          responseType: 'arraybuffer',
          maxRedirects: 5,
          timeout: 60000,
          headers: {
            'Accept': '*/*',
            'Authorization': `OAuth oauth_consumer_key="${this.config.apiKey}", oauth_token="${this.config.token}"`,
          },
        });

        const buffer = Buffer.from(contentResponse.data);
        const md5Hash = crypto.createHash('md5').update(buffer).digest('hex');
        const filePath = path.join(this.config.attachmentDir, attachment.fileName);

        if (!fs.existsSync(this.config.attachmentDir)) {
          fs.mkdirSync(this.config.attachmentDir, { recursive: true });
        }

        fs.writeFileSync(filePath, buffer);

        return {
          attachment,
          path: filePath,
          md5: md5Hash,
          url: attachment.url,
        };
      } catch (error) {
        let errorMessage = 'Unknown error';
        if (axios.isAxiosError(error)) {
          if (error.response) {
            errorMessage = `HTTP ${error.response.status}: ${error.response.statusText}`;
          } else if (error.code) {
            errorMessage = `Network error: ${error.code} - ${error.message}`;
          } else {
            errorMessage = error.message;
          }
        } else if (error instanceof Error) {
          errorMessage = error.message;
        }

        console.error('Failed to download attachment:', errorMessage);

        return {
          attachment,
          path: null,
          md5: null,
          url: attachment.url,
          error: `Download failed: ${errorMessage}`,
        };
      }
    });
  }

  /**
   * Moves a card to a different list
   * @param cardId The ID of the card to move
   * @param listId The ID of the destination list
   */
  async moveCard(cardId: string, listId: string): Promise<TrelloCard> {
    return this.handleRequest(async () => {
      const response = await this.axiosInstance.put(`/cards/${cardId}`, {
        idList: listId,
      });
      return response.data;
    });
  }

  /**
   * Adds a comment to a card
   * @param cardId The ID of the card to comment on
   * @param text The comment text
   */
  async addComment(cardId: string, text: string): Promise<TrelloAction> {
    return this.handleRequest(async () => {
      const response = await this.axiosInstance.post(`/cards/${cardId}/actions/comments`, {
        text,
      });
      return response.data;
    });
  }

  /**
   * Retrieves all labels on the board
   * @param boardId The ID of the board to get labels from
   */
  async getLabels(boardId: string): Promise<TrelloLabel[]> {
    return this.handleRequest(async () => {
      const response = await this.axiosInstance.get(`/boards/${boardId}/labels`);
      return response.data;
    });
  }

  /**
   * Creates a new label on the board
   * @param boardId The ID of the board to add the label to
   * @param name The name of the label
   * @param color The color of the label (green, yellow, orange, red, purple, blue, sky, lime, pink, black, null)
   */
  async addLabel(boardId: string, name: string, color: string): Promise<TrelloLabel> {
    return this.handleRequest(async () => {
      const response = await this.axiosInstance.post(`/boards/${boardId}/labels`, {
        name,
        color,
      });
      return response.data;
    });
  }

  /**
   * ローカルに保存した添付ファイルを削除する。
   * セキュリティのため、TRELLO_ATTACHMENT_DIR内のファイルのみ削除可能。
   *
   * @param filePath - 削除するファイルのパス
   * @returns Promise resolving to an object containing:
   *   - success: 削除成功かどうか
   *   - message: 結果メッセージ
   */
  deleteLocalAttachment(filePath: string): { success: boolean; message: string } {
    if (!this.config.attachmentDir) {
      return {
        success: false,
        message: 'TRELLO_ATTACHMENT_DIR is not set',
      };
    }

    const resolvedPath = path.resolve(filePath);
    const resolvedAttachmentDir = path.resolve(this.config.attachmentDir);

    if (!resolvedPath.startsWith(resolvedAttachmentDir + path.sep)) {
      return {
        success: false,
        message: `Security error: Cannot delete files outside of attachment directory (${resolvedAttachmentDir})`,
      };
    }

    if (!fs.existsSync(resolvedPath)) {
      return {
        success: false,
        message: `File not found: ${resolvedPath}`,
      };
    }

    try {
      fs.unlinkSync(resolvedPath);
      return {
        success: true,
        message: `Deleted: ${resolvedPath}`,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        message: `Failed to delete: ${errorMessage}`,
      };
    }
  }
}
