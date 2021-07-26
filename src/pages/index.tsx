import { GetStaticProps } from 'next';
import { FiCalendar, FiUser } from 'react-icons/fi';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import Link from 'next/link';
import { useState } from 'react';
import { getPrismicClient } from '../services/prismic';
import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps): JSX.Element {
  const [nextPage, setNextPage] = useState(postsPagination.next_page);
  const [posts, setPosts] = useState(
    postsPagination.results.map(result => {
      return {
        data: {
          author: result.data.author,
          subtitle: result.data.subtitle,
          title: result.data.title,
        },
        uid: result.uid,
        first_publication_date: format(
          new Date(result.first_publication_date),
          'dd MMM yyyy',
          { locale: ptBR }
        ),
      };
    })
  );

  function handleLoadMore(): void {
    const updatedPost = [...posts];
    fetch(postsPagination.next_page)
      .then(response => response.json())
      .then(data => {
        const newNextPage = data.next_page;
        const newPost = data.results.map(result => {
          return {
            data: {
              author: result.data.author,
              subtitle: result.data.subtitle,
              title: result.data.title,
            },
            uid: result.uid,
            first_publication_date: format(
              new Date(result.first_publication_date),
              'dd MMM yyyy',
              { locale: ptBR }
            ),
          };
        });
        updatedPost.push(...newPost);
        setNextPage(newNextPage);
        setPosts(updatedPost);
      });
  }
  return (
    <>
      <main className={commonStyles.container}>
        <img src="/images/logo.svg" alt="logo" />
        {posts.map(result => (
          <div key={result.uid} className={styles.content}>
            <Link href={`/post/${result.uid}`}>
              <h1>{result.data.title}</h1>
            </Link>
            <p>{result.data.subtitle}</p>
            <div className={styles.dateAuthor}>
              <FiCalendar />
              <time>{result.first_publication_date}</time>
              <FiUser />
              <p>{result.data.author}</p>
            </div>
          </div>
        ))}
        {nextPage && (
          <button
            type="button"
            onClick={handleLoadMore}
            className={styles.linkPost}
          >
            Carregar mais posts
          </button>
        )}
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query('');
  const postsPagination = {
    next_page: postsResponse.next_page,
    results: postsResponse.results.map(result => {
      return {
        data: {
          author: result.data.author,
          subtitle: result.data.subtitle,
          title: result.data.title,
        },
        uid: result.uid,
        first_publication_date: result.first_publication_date,
      };
    }),
  };
  return {
    props: {
      postsPagination,
    },
  };
};
