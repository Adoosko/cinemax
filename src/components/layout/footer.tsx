import { mainAuthor } from '../../../config/authors';

export function Footer() {
  return (
    <footer className="bg-black text-white py-4 text-center">
      <p className="text-sm">
        Developed by{' '}
        <a
          href={mainAuthor.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-netflix-dark-red hover:underline"
        >
          {mainAuthor.name}
        </a>{' '}
      </p>
    </footer>
  );
}
