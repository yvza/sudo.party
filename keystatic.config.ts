// keystatic.config.ts
import { config, fields, collection, LocalConfig, GitHubConfig } from '@keystatic/core';
import { isProd } from './config';

const localMode: LocalConfig['storage'] = {
  kind: 'local'
}

const githubMode: GitHubConfig['storage'] = {
  kind: 'github',
  repo: {
    owner: 'yvza',
    name: 'sudo.party'
  }
}

export default config({
  storage: isProd ? githubMode : localMode,
  collections: {
    posts: collection({
      label: 'Posts',
      slugField: 'title',
      path: 'posts/*',
      format: { contentField: 'content' },
      schema: {
        title: fields.slug({ name: { label: 'Title', validation: { isRequired: true } } }),
        date: fields.date({ label: 'Date', validation: { isRequired: true }, defaultValue: { kind: 'today' } }),
        draft: fields.checkbox({ label: 'Draft', description: 'Is it draft mode?' }),
        visibility: fields.text({ label: 'Visibility', description: 'private || public', validation: { isRequired: true } }),
        membership: fields.text({ label: 'Membership', description: 'sgbcode || sudopartypass || empty' }),
        description: fields.text({ label: 'Description', validation: { length: { max: 250 } }, multiline: true }),
        content: fields.document({
          label: 'Content',
          formatting: true,
          dividers: true,
          links: true,
          images: {
            directory: 'public/site/images',
            publicPath: '/site/images',
            schema: {
              title: fields.text({
                label: 'Caption',
                description:
                  'The text to display under the image in a caption.',
              }),
            },
          },
        }),
      },
    }),
  },
});