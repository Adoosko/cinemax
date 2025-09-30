type Author = {
  name: string;
  email?: string;
  url?: string;
  role: string;
};

export const authors: Author[] = [
  {
    name: 'Adrián Finik',
    email: 'adoos.developer@gmail.com',
    url: 'https://adrianfinik.sk',
    role: 'Project Author',
  },
];

export const mainAuthor = authors[0];
