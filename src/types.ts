export interface TrelloConfig {
  apiKey: string;
  token: string;
  attachmentDir?: string;
}

export interface TrelloCard {
  id: string;
  name: string;
  desc: string;
  due: string | null;
  idList: string;
  idLabels: string[];
  closed: boolean;
  url: string;
  dateLastActivity: string;
}

export interface TrelloList {
  id: string;
  name: string;
  closed: boolean;
  idBoard: string;
  pos: number;
}

export interface TrelloAction {
  id: string;
  idMemberCreator: string;
  type: string;
  date: string;
  data: {
    text?: string;
    card?: {
      id: string;
      name: string;
    };
    list?: {
      id: string;
      name: string;
    };
    board: {
      id: string;
      name: string;
    };
  };
  memberCreator: {
    id: string;
    fullName: string;
    username: string;
  };
}

export interface TrelloLabel {
  id: string;
  name: string;
  color: string;
}

export interface TrelloMember {
  id: string;
  fullName: string;
  username: string;
  avatarUrl: string | null;
}

/**
 * Represents an attachment on a Trello card.
 * Attachments can be files uploaded directly to Trello or links to external resources.
 */
export interface TrelloAttachment {
  /** Unique identifier for the attachment */
  id: string;
  /** Display name of the attachment */
  name: string;
  /** URL to access/download the attachment */
  url: string;
  /** Size of the attachment in bytes (0 for external links) */
  bytes: number;
  /** MIME type of the attachment (e.g., "image/png", "application/pdf") */
  mimeType: string;
  /** ISO 8601 date string when the attachment was added */
  date: string;
  /** ID of the member who added the attachment */
  idMember: string;
  /** Whether this is an upload to Trello (true) or an external link (false) */
  isUpload: boolean;
  /** Filename of the attachment */
  fileName: string;
}

export interface RateLimiter {
  canMakeRequest(): boolean;
  waitForAvailableToken(): Promise<void>;
}
