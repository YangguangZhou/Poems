// lib/parsePoems.js
export function parsePoems(data) {
  const poemsData = data.trim().split('\n\n\n');
  return poemsData.map((poem) => {
    const lines = poem.split('\n');
    const title = lines[0].trim();
    const author = lines[1].trim();

    let content = '';
    let translation = '';
    let section = 'content';
    for (let i = 2; i < lines.length; i++) {
      if (lines[i].trim() === '') {
        section = 'translation';
        continue;
      }
      if (section === 'content') {
        content += lines[i].trim() + '\n';
      } else {
        translation += lines[i].trim() + '\n';
      }
    }

    return { title, author, content: content.trim().split('\n'), translation: translation.trim().split('\n') };
  });
}