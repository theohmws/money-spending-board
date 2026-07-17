import type { Metadata } from 'next';

import { Main } from '@/templates/Main';

type IBlogPageProps = {
  params: Promise<{ slug: string }>;
};

export const generateStaticParams = () =>
  [...Array(10)].map((_, index) => ({ slug: `blog-${index}` }));

export const generateMetadata = async ({
  params,
}: IBlogPageProps): Promise<Metadata> => {
  const { slug } = await params;

  return {
    title: slug,
    description: 'Lorem ipsum',
  };
};

const BlogPost = async ({ params }: IBlogPageProps) => {
  const { slug } = await params;

  return (
    <Main>
      <h1 className="capitalize">{slug}</h1>
      <p>
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Inventore eos
        earum doloribus, quibusdam magni accusamus vitae! Nisi, sunt! Aliquam
        iste expedita cupiditate a quidem culpa eligendi, aperiam saepe dolores
        ipsum!
      </p>
    </Main>
  );
};

export default BlogPost;
