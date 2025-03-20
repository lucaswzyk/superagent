import { MessageInterface, ModelOptions, TotalTokenUsed } from '@type/chat';

import useStore from '@store/store';
import { getOpenAIUsage } from '@api/api';

import { Tiktoken } from '@dqbd/tiktoken/lite';
const cl100k_base = await import('@dqbd/tiktoken/encoders/cl100k_base.json');

const encoder = new Tiktoken(
  cl100k_base.bpe_ranks,
  {
    ...cl100k_base.special_tokens,
    '<|im_start|>': 100264,
    '<|im_end|>': 100265,
    '<|im_sep|>': 100266,
  },
  cl100k_base.pat_str
);

// https://github.com/dqbd/tiktoken/issues/23#issuecomment-1483317174
export const getChatGPTEncoding = (
  messages: MessageInterface[],
  model: ModelOptions
) => {
  const isGpt3 = model === 'gpt-3.5-turbo';

  const msgSep = isGpt3 ? '\n' : '';
  const roleSep = isGpt3 ? '\n' : '<|im_sep|>';

  const serialized = [
    messages
      .map(({ role, content }) => {
        return `<|im_start|>${role}${roleSep}${content}<|im_end|>`;
      })
      .join(msgSep),
    `<|im_start|>assistant${roleSep}`,
  ].join(msgSep);

  return encoder.encode(serialized, 'all');
};

const countTokens = (messages: MessageInterface[], model: ModelOptions) => {
  if (messages.length === 0) return 0;
  return getChatGPTEncoding(messages, model).length;
};

export const limitMessageTokens = (
  messages: MessageInterface[],
  limit: number = 4096,
  model: ModelOptions
): MessageInterface[] => {
  const limitedMessages: MessageInterface[] = [];
  let tokenCount = 0;

  const isSystemFirstMessage = messages[0]?.role === 'system';
  let retainSystemMessage = false;

  // Check if the first message is a system message and if it fits within the token limit
  if (isSystemFirstMessage) {
    const systemTokenCount = countTokens([messages[0]], model);
    if (systemTokenCount < limit) {
      tokenCount += systemTokenCount;
      retainSystemMessage = true;
    }
  }

  // Iterate through messages in reverse order, adding them to the limitedMessages array
  // until the token limit is reached (excludes first message)
  for (let i = messages.length - 1; i >= 1; i--) {
    const count = countTokens([messages[i]], model);
    if (count + tokenCount > limit) break;
    tokenCount += count;
    limitedMessages.unshift({ ...messages[i] });
  }

  // Process first message
  if (retainSystemMessage) {
    // Insert the system message in the third position from the end
    limitedMessages.splice(-3, 0, { ...messages[0] });
  } else if (!isSystemFirstMessage) {
    // Check if the first message (non-system) can fit within the limit
    const firstMessageTokenCount = countTokens([messages[0]], model);
    if (firstMessageTokenCount + tokenCount < limit) {
      limitedMessages.unshift({ ...messages[0] });
    }
  }

  return limitedMessages;
};

export const updateTotalTokenUsed = async (
  model: ModelOptions,
  promptMessages: MessageInterface[],
  completionMessage: MessageInterface
) => {
  const setTotalTokenUsed = useStore.getState().setTotalTokenUsed;
  const setError = useStore.getState().setError;
  const updatedTotalTokenUsed: TotalTokenUsed = JSON.parse(
    JSON.stringify(useStore.getState().totalTokenUsed)
  );

  console.log('Updating token usage for model:', model);
  console.log('Current token usage state:', updatedTotalTokenUsed);

  try {
    const apiKey = useStore.getState().apiKey;
    if (!apiKey) {
      console.error('No API key available for token usage tracking');
      setError('API key is required to track token usage');
      return;
    }

    // Get usage data from OpenAI
    const usageData = await getOpenAIUsage(apiKey);
    console.log('Received usage data from OpenAI:', usageData);
    
    // Update the total tokens used based on the API response
    updatedTotalTokenUsed[model] = {
      promptTokens: usageData.n_prompt_tokens,
      completionTokens: usageData.n_completion_tokens,
    };
    console.log('Updated token usage state:', updatedTotalTokenUsed);
    setTotalTokenUsed(updatedTotalTokenUsed);
  } catch (error) {
    console.error('Error in updateTotalTokenUsed:', error);
    setError(`Failed to update token usage: ${(error as Error).message}`);
  }
};

export default countTokens;
