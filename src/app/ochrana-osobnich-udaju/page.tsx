import { Container, Card, CardBody } from '@/components/ui';

export default function OchranaOsobnichUdajuPage() {
  return (
    <div className="bg-zinc-100">
      <Container className="max-w-3xl mx-auto py-16">
        <Card className="rounded-2xl bg-white/90 shadow-lg backdrop-blur-sm">
          <CardBody className="prose prose-zinc max-w-none">
            <h1>Zásady ochrany osobních údajů</h1>

            <h2>1. Správce osobních údajů</h2>
            <p>Správcem osobních údajů je:</p>
            <p>
              Hospoda u Vavřince
              <br />
              (dále jen „správce“)
              <br />
              Kontaktní e-mail: rezervace@hospodauvavrince.cz
            </p>

            <h2>2. Jaké osobní údaje zpracováváme</h2>
            <p>V rámci online rezervace zpracováváme následující osobní údaje:</p>
            <ul>
              <li>jméno a příjmení</li>
              <li>telefonní číslo</li>
              <li>e-mailová adresa</li>
              <li>případná poznámka uvedená v rezervaci</li>
            </ul>
            <p>Tyto údaje poskytujete dobrovolně při vytváření rezervace.</p>

            <h2>3. Účel zpracování</h2>
            <p>Osobní údaje zpracováváme výhradně za účelem:</p>
            <ul>
              <li>vyřízení a správy rezervace na akci</li>
              <li>případného kontaktování v souvislosti s rezervací</li>
              <li>zaslání potvrzení rezervace</li>
            </ul>
            <p>Údaje nejsou používány k marketingovým účelům.</p>

            <h2>4. Právní základ zpracování</h2>
            <p>Právním základem zpracování je:</p>
            <ul>
              <li>plnění smlouvy (rezervace místa na akci),</li>
              <li>případně váš souhlas udělený při odeslání rezervace.</li>
            </ul>

            <h2>5. Doba uchování údajů</h2>
            <p>Osobní údaje uchováváme:</p>
            <ul>
              <li>po dobu trvání akce</li>
              <li>maximálně 30 dní po skončení akce</li>
            </ul>
            <p>Po uplynutí této doby jsou údaje vymazány.</p>

            <h2>6. Předávání údajů třetím stranám</h2>
            <p>Osobní údaje nepředáváme žádným třetím osobám.</p>
            <p>
              Technicky mohou být údaje zpracovávány poskytovateli IT služeb (hosting,
              databáze, e-mailové služby), kteří zajišťují provoz rezervačního systému. Tito
              poskytovatelé jsou smluvně zavázáni k ochraně údajů.
            </p>

            <h2>7. Vaše práva</h2>
            <p>V souvislosti se zpracováním osobních údajů máte právo:</p>
            <ul>
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

            <h2>8. Zabezpečení údajů</h2>
            <p>
              Osobní údaje jsou chráněny technickými a organizačními opatřeními proti
              zneužití, ztrátě nebo neoprávněnému přístupu.
            </p>
          </CardBody>
        </Card>
      </Container>
    </div>
  );
}

