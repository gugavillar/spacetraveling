import format from 'date-fns/format';
import ptBR from 'date-fns/locale/pt-BR';
import { GetStaticPaths, GetStaticProps } from 'next';
import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';
import { RichText } from 'prismic-dom';
import { useRouter } from 'next/router';
import Header from '../../components/Header';
import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps): JSX.Element {
  const router = useRouter();
  const date = format(new Date(post.first_publication_date), 'dd MMM yyyy', {
    locale: ptBR,
  });
  const timeReading = post.data.content.reduce((acc, cur) => {
    return Math.round(RichText.asText(cur.body).split(' ').length / 200);
  }, 0);
  const htmlBody = post.data.content.map((result, index) => {
    return {
      index,
      heading: result.heading,
      text: RichText.asHtml(result.body),
    };
  });
  return (
    <>
      {router.isFallback ? (
        <p>Carregando...</p>
      ) : (
        <>
          <Header />
          <div className={styles.banner}>
            <img src={post.data.banner.url} alt="banner" />
          </div>
          <main className={commonStyles.container}>
            <div className={styles.post}>
              <h1>{post.data.title}</h1>
              <div className={styles.infoPost}>
                <FiCalendar />
                <time>{date}</time>
                <FiUser />
                <span>{post.data.author}</span>
                <FiClock />
                <span>{timeReading} min</span>
              </div>
              <div className={styles.postContent}>
                {htmlBody.map(content => (
                  <div key={content.index}>
                    <h2>{content.heading}</h2>
                    <div dangerouslySetInnerHTML={{ __html: content.text }} />
                  </div>
                ))}
              </div>
            </div>
          </main>
        </>
      )}
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query('');
  const postPaths = posts.results.map(content => {
    return {
      params: {
        slug: content.uid,
      },
    };
  });
  return {
    paths: postPaths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;
  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(slug), {});
  const post = {
    first_publication_date: response.first_publication_date,
    uid: response.uid,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      banner: {
        url: response.data.banner.url,
      },
      author: response.data.author,
      content: response.data.content,
    },
  };
  return {
    props: { post },
  };
};
