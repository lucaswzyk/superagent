import React, { useEffect, useMemo, useState } from 'react';
import useStore from '@store/store';
import { shallow } from 'zustand/shallow';
import { getOpenAIUsage } from '@api/api';

import { modelCost } from '@constants/chat';

const TokenCount = React.memo(() => {
  const [tokenCount, setTokenCount] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const generating = useStore((state) => state.generating);
  const model = useStore((state) =>
    state.chats
      ? state.chats[state.currentChatIndex].config.model
      : 'gpt-3.5-turbo'
  );

  const cost = useMemo(() => {
    const price =
      modelCost[model].prompt.price *
      (tokenCount / modelCost[model].prompt.unit);
    return price.toPrecision(3);
  }, [model, tokenCount]);

  useEffect(() => {
    const fetchTokenUsage = async () => {
      if (generating) return;
      
      try {
        const apiKey = useStore.getState().apiKey;
        if (!apiKey) {
          setError('API key required for token counting');
          return;
        }

        const usageData = await getOpenAIUsage(apiKey);
        const totalTokens = usageData.contextTokens + usageData.generatedTokens;
        setTokenCount(totalTokens);
        setError(null);
      } catch (error) {
        console.error('Error fetching token usage:', error);
        setError('Failed to fetch token usage');
      }
    };

    fetchTokenUsage();
  }, [generating, model]);

  if (error) {
    return (
      <div className="text-xs italic text-red-500 dark:text-red-400">
        {error}
      </div>
    );
  }

  return (
    <div className="text-xs italic text-gray-500 dark:text-gray-400">
      Tokens: {tokenCount} (${cost})
    </div>
  );
});

export default TokenCount;
