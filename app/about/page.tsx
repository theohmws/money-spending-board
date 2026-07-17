import type { Metadata } from 'next';

import { Main } from '@/templates/Main';

export const metadata: Metadata = {
  title: 'About',
  description: 'About',
};

const About = () => (
  <Main>
    <p>
      <span role="img" aria-label="party-popper">
        🎉
      </span>
      Special thank Next.js Boilerplate with Tailwind CSSwith from{' '}
      <a href="https://creativedesignsguru.com">CreativeDesignsGuru</a>.
    </p>
  </Main>
);

export default About;
