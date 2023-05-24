import { Meta } from '@/layouts/Meta';
import { Main } from '@/templates/Main';

const About = () => (
  <Main meta={<Meta title="About" description="About" />}>
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
