import Link from 'next/link';
import { Container, Card, CardBody } from '@/components/ui';

export default function OchranaOsobnichUdajuPage() {
  return (
    <div className="min-h-screen bg-zinc-100">
      <Container className="max-w-3xl mx-auto my-16 px-6">
        <Card className="rounded-2xl border border-white/40 bg-white/90 px-0 py-0 shadow-xl backdrop-blur-md">
          <CardBody className="px-6 py-10">
            <div className="mb-6">
              <Link
                href="/rezervace"
                className="text-sm text-zinc-600 underline hover:text-zinc-900"
              >
                ← Zpět na rezervaci
              </Link>
            </div>

            <h1 className="mb-8 text-3xl font-bold text-zinc-900 md:text-4xl">
              Zásady ochrany osobních údajů
            </h1>

            <section className="mb-8">
              <h2 className="mb-3 text-lg font-semibold text-zinc-800">
                1. Správce osobních údajů
              </h2>
              <div className="space-y-3 text-sm leading-relaxed text-zinc-700 md:text-base">
                <p>Správcem osobních údajů je:</p>
                <p>
                  Hospoda u Vavřince
                  <br />
                  (dále jen „správce“)
                  <br />
                  Kontaktní e-mail: rezervace@hospodauvavrince.cz
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="mb-3 text-lg font-semibold text-zinc-800">
                2. Jaké osobní údaje zpracováváme
              </h2>
              <div className="space-y-3 text-sm leading-relaxed text-zinc-700 md:text-base">
                <p>V rámci online rezervace zpracováváme následující osobní údaje:</p>
                <ul className="list-disc space-y-1 pl-6">
                  <li>jméno a příjmení</li>
                  <li>telefonní číslo</li>
                  <li>e-mailová adresa</li>
                  <li>případná poznámka uvedená v rezervaci</li>
                </ul>
                <p>Tyto údaje poskytujete dobrovolně při vytváření rezervace.</p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="mb-3 text-lg font-semibold text-zinc-800">
                3. Účel zpracování
              </h2>
              <div className="space-y-3 text-sm leading-relaxed text-zinc-700 md:text-base">
                <p>Osobní údaje zpracováváme výhradně za účelem:</p>
                <ul className="list-disc space-y-1 pl-6">
                  <li>vyřízení a správy rezervace na akci</li>
                  <li>případného kontaktování v souvislosti s rezervací</li>
                  <li>zaslání potvrzení rezervace</li>
                </ul>
                <p>Údaje nejsou používány k marketingovým účelům.</p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="mb-3 text-lg font-semibold text-zinc-800">
                4. Právní základ zpracování
              </h2>
              <div className="space-y-3 text-sm leading-relaxed text-zinc-700 md:text-base">
                <p>Právním základem zpracování je:</p>
                <ul className="list-disc space-y-1 pl-6">
                  <li>plnění smlouvy (rezervace místa na akci),</li>
                  <li>případně váš souhlas udělený při odeslání rezervace.</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="mb-3 text-lg font-semibold text-zinc-800">
                5. Doba uchování údajů
              </h2>
              <div className="space-y-3 text-sm leading-relaxed text-zinc-700 md:text-base">
                <p>Osobní údaje uchováváme:</p>
                <ul className="list-disc space-y-1 pl-6">
                  <li>po dobu trvání akce</li>
                  <li>maximálně 30 dní po skončení akce</li>
                </ul>
                <p>Po uplynutí této doby jsou údaje vymazány.</p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="mb-3 text-lg font-semibold text-zinc-800">
                6. Předávání údajů třetím stranám
              </h2>
              <div className="space-y-3 text-sm leading-relaxed text-zinc-700 md:text-base">
                <p>Osobní údaje nepředáváme žádným třetím osobám.</p>
                <p>
                  Technicky mohou být údaje zpracovávány poskytovateli IT služeb
                  (hosting, databáze, e-mailové služby), kteří zajišťují provoz
                  rezervačního systému. Tito poskytovatelé jsou smluvně zavázáni k
                  ochraně údajů.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="mb-3 text-lg font-semibold text-zinc-800">
                7. Vaše práva
              </h2>
              <div className="space-y-3 text-sm leading-relaxed text-zinc-700 md:text-base">
                <p>V souvislosti se zpracováním osobních údajů máte právo:</p>
                <ul className="list-disc space-y-1 pl-6">
                  <li>požádat o přístup ke svým údajům</li>
                  <li>požádat o opravu nepřesných údajů</li>
                  <li>požádat o výmaz údajů</li>
                  <li>vznést námitku proti zpracování</li>
                </ul>
                <p>
                  V případě jakéhokoli dotazu nebo žádosti nás kontaktujte na:
                  <br />
                  rezervace@hospodauvavrince.cz
                </p>
              </div>
            </section>

            <section className="mb-0">
              <h2 className="mb-3 text-lg font-semibold text-zinc-800">
                8. Zabezpečení údajů
              </h2>
              <div className="space-y-3 text-sm leading-relaxed text-zinc-700 md:text-base">
                <p>
                  Osobní údaje jsou chráněny technickými a organizačními opatřeními
                  proti zneužití, ztrátě nebo neoprávněnému přístupu.
                </p>
              </div>
            </section>
          </CardBody>
        </Card>
      </Container>
    </div>
  );
}

