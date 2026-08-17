import ClientPage from './client-page';

export function generateStaticParams() {
  return [{ id: '1' }];
}

export default function Page() {
  return <ClientPage />;
}
