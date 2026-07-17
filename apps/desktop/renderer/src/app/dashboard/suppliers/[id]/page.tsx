import ClientPage from './client';
export default function Page() {
  return <ClientPage />;
}
export async function generateStaticParams() {
  return [{ id: '1' }];
}
