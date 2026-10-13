const normalize = value => value.trim().toLowerCase();

export function groupTopics(config, posts) {
  if (!config || !Array.isArray(config.topics)) throw new Error('topics.config.json: topics must be an array');
  const ids = new Set();
  function group(topic) {
    if (!topic || typeof topic.id !== 'string' || !/^[a-z0-9-]+$/.test(topic.id) || ids.has(topic.id)) {
      throw new Error('topics.config.json: topic id must be unique and use lowercase letters, numbers or hyphens');
    }
    const tags = topic.tags ?? [];
    const children = topic.children ?? [];
    if (typeof topic.title !== 'string' || !topic.title.trim() || !Array.isArray(tags) || tags.some(tag => typeof tag !== 'string' || !tag.trim()) || !Array.isArray(children) || (!tags.length && !children.length)) {
      throw new Error('topics.config.json: every topic needs a title and tags or children');
    }
    ids.add(topic.id);
    const groupedChildren = children.map(group);
    const childPosts = new Set(groupedChildren.flatMap(child => child.posts));
    const matchingTags = new Set(tags.map(normalize));
    const matches = posts.filter(post => post.tags.some(tag => matchingTags.has(normalize(tag))));
    const allPosts = posts.filter(post => childPosts.has(post) || matches.includes(post));
    return { ...topic, children: groupedChildren, posts: allPosts, directPosts: matches.filter(post => !childPosts.has(post)) };
  }
  return config.topics.map(group);
}
