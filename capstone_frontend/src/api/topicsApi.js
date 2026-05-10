import { apiFetch } from './index';
import { TOPICS } from '../data/topics';

const buildTopicsWithApiData = (categories) => {
  return TOPICS.map((topic) => {
    const apiSubTopics = categories[topic.title];
    if (!apiSubTopics) return topic;
    return {
      ...topic,
      subTopics: apiSubTopics.map((sub) => ({
        id: sub.id,
        title: sub.title,
        description: sub.descriptionShort ?? sub.description ?? '',
        description_short: sub.descriptionShort ?? sub.description ?? '',
        description_long: sub.descriptionLong ?? '',
        pro: sub.pro,
        con: sub.con,
        references: sub.references ?? [],
      })),
    };
  });
};

export const fetchTodayTopics = async () => {
  const data = await apiFetch('/api/topics');
  return buildTopicsWithApiData(data.categories);
};
