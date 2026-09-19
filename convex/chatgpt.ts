import { getServiceToken } from 'convex/server';

export type ChatMessage = { role: 'system' | 'user'; content: string };

export type ChatPick = {
  id: string;
  name?: string;
  reason: string;
  fit: 'high' | 'medium' | 'low';
};

export async function completeChat(messages: ChatMessage[]) {
  try {
    const token = await getServiceToken('ai-gateway');
    return await requestChatCompletion(
      'https://ai-gateway.convex.dev/v1/chat/completions',
      token,
      'openai/gpt-4o-mini',
      messages,
    );
  } catch {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error(
        'Add OPENAI_API_KEY with npx convex env set OPENAI_API_KEY, or enable the Convex AI Gateway.',
      );
    }
    return await requestChatCompletion(
      'https://api.openai.com/v1/chat/completions',
      apiKey,
      'gpt-4o-mini',
      messages,
    );
  }
}

export function prettyJson(content: string) {
  try {
    return JSON.stringify(JSON.parse(content), null, 2);
  } catch {
    return content;
  }
}

export function extractJson(content: string) {
  const fenced = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced?.[1] ?? content;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      return parsed as Record<string, unknown>;
    }
  } catch {
    return {};
  }
  return {};
}

export function parseChatPicks(content: string, knownIds: Set<string>): ChatPick[] {
  const json = extractJson(content);
  const rawPicks = Array.isArray(json.picks) ? json.picks : [];
  return rawPicks.flatMap((pick) => {
    if (!pick || typeof pick !== 'object') {
      return [];
    }
    const record = pick as { id?: unknown; name?: unknown; reason?: unknown; fit?: unknown };
    const id =
      typeof record.id === 'string'
        ? record.id
        : typeof record.id === 'number'
          ? String(record.id)
          : undefined;
    const name = typeof record.name === 'string' ? record.name.trim() : undefined;
    const reason = typeof record.reason === 'string' ? record.reason.trim() : '';
    const fit =
      record.fit === 'high' || record.fit === 'medium' || record.fit === 'low'
        ? record.fit
        : 'medium';
    if (!id || !knownIds.has(id) || !reason) {
      return [];
    }
    return [{ id, name, reason, fit }];
  });
}

export function parseChatSummary(content: string, fallback: string) {
  return parseChatString(content, 'summary', fallback);
}

export function parseChatString(content: string, key: string, fallback = '') {
  const json = extractJson(content);
  const value = json[key];
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback;
}

async function requestChatCompletion(
  endpoint: string,
  apiKey: string,
  model: string,
  messages: ChatMessage[],
) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature: 0.4,
      response_format: { type: 'json_object' },
      messages,
    }),
  });

  if (!response.ok) {
    throw new Error(`ChatGPT request failed (${response.status})`);
  }

  const payload: unknown = await response.json();
  const content = readChatContent(payload);
  if (!content) {
    throw new Error('ChatGPT returned an empty response');
  }
  return content;
}

function readChatContent(payload: unknown) {
  if (!payload || typeof payload !== 'object') {
    return undefined;
  }
  const choices = (payload as { choices?: unknown }).choices;
  if (!Array.isArray(choices) || choices.length === 0) {
    return undefined;
  }
  const message = (choices[0] as { message?: { content?: unknown } }).message;
  return typeof message?.content === 'string' ? message.content : undefined;
}
