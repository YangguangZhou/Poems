import debug from 'debug';

const log = debug('app:parsePoems');

export function parsePoems(data) {
    const normalizedData = data.replace(/\r\n/g, '\n').trim();
    const poemsData = normalizedData.split('\n\n\n');
    log('原始数据:', poemsData);
    return poemsData.map((poem) => {
        const lines = poem.split('\n');
        const title = lines[0].trim();
        const author = lines[1].trim();

        let content = '';
        let translation = '';
        let section = 'content';
        for (let i = 3; i < lines.length; i++) {
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
        log(`内容: ${content}`);
        return { title, author, content: content.trim().split('\n'), translation: translation.trim().split('\n') };
    });
}