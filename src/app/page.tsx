import Link from 'next/link';
import { Container, Card, CardBody } from '@/components/ui';

export default function HomePage() {
  return (
    <Container className="py-12 sm:py-16">
      <Card className="text-center">
        <CardBody>
          <h1 className="text-2xl font-bold text-zinc-900 sm:text-3xl">
            Hospoda u Vavřince
          </h1>
          <p className="mt-2 text-zinc-600">Rezervace na jednorázovou akci</p>
          <Link
            href="/rezervace"
            className="mt-8 inline-flex items-center justify-center rounded-xl bg-zinc-900 px-6 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2"
          >
            Rezervovat
          </Link>
        </CardBody>
      </Card>
    </Container>
  );
}
