/* eslint-disable react/no-danger */
import format from 'date-fns/format';
import ptBR from 'date-fns/locale/pt-BR';
import { GetStaticPaths, GetStaticProps } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { RichText } from 'prismic-dom';
import { useEffect } from 'react';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';
import Header from '../../components/Header';
import { getPrismicClient } from '../../services/prismic';
import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  last_publication_date: string | null;
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
interface PrevPost {
  uid: string | null;
  data: {
    title: string;
  };
}

interface NextPost {
  uid: string | null;
  data: {
    title: string;
  };
}
interface PostProps {
  post: Post;
  prevPost: PrevPost | null;
  nextPost: NextPost | null;
}

export default function Post({
  post,
  nextPost,
  prevPost,
}: PostProps): JSX.Element {
  useEffect(() => {
    const main = document.getElementsByTagName('main');
    const scriptUt = document.createElement('script');
    scriptUt.src = 'https://utteranc.es/client.js';
    scriptUt.async = true;
    scriptUt.setAttribute('repo', 'gugavillar/spacetraveling');
    scriptUt.setAttribute('issue-term', 'pathname');
    scriptUt.setAttribute('label', 'comment :speech_balloon:');
    scriptUt.setAttribute('theme', 'photon-dark');
    scriptUt.setAttribute('crossorigin', 'anonymous');
    main[0].appendChild(scriptUt);
  }, []);

  const router = useRouter();
  const date = format(new Date(post.first_publication_date), 'dd MMM yyyy', {
    locale: ptBR,
  });
  const lastPublicationDate = format(
    new Date(post.last_publication_date),
    "'* editado em 'dd MMM yyyy, ' às ' HH:mm",
    {
      locale: ptBR,
    }
  );
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
              <p className={styles.last}>{lastPublicationDate}</p>
              <div className={styles.postContent}>
                {htmlBody.map(content => (
                  <div key={content.index}>
                    <h2>{content.heading}</h2>
                    <div dangerouslySetInnerHTML={{ __html: content.text }} />
                  </div>
                ))}
              </div>
              <div className={styles.divider} />
              <div className={styles.navigate}>
                <div className={styles.prev}>
                  {prevPost && (
                    <>
                      <h2>{prevPost?.data.title}</h2>
                      <Link href={`${prevPost?.uid}`}>
                        <p>Post anterior</p>
                      </Link>
                    </>
                  )}
                </div>
                <div className={styles.next}>
                  {nextPost && (
                    <>
                      <h2>{nextPost?.data.title}</h2>
                      <Link href={`${nextPost?.uid}`}>
                        <p>Próximo post</p>
                      </Link>
                    </>
                  )}
                </div>
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
  const nextPost = await prismic
    .query('', {
      after: response.id,
      orderings: '[document.first_publication_date]',
    })
    .then(next => next.results[0] || null);
  const prevPost = await prismic
    .query('', {
      after: response.id,
      orderings: '[document.first_publication_date desc]',
    })
    .then(prev => prev.results[0] || null);
  const post = {
    first_publication_date: response.first_publication_date,
    last_publication_date: response.last_publication_date,
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
    props: { post, nextPost, prevPost },
  };
};
