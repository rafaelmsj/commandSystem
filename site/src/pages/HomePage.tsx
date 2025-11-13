import { useNavigate } from 'react-router-dom';
import { Instagram, MapPin } from 'lucide-react';
import Header from '../components/Header';
import Button from '../components/Button';
import Card from '../components/Card';
import Carousel from '../components/Carousel';

export default function HomePage() {
  const navigate = useNavigate();

  const images = [
    '/Imagem do WhatsApp de 2025-11-12 à(s) 18.12.28_86099740.jpg',
    '/Imagem do WhatsApp de 2025-11-12 à(s) 18.55.48_0054564d.jpg',
    '/Imagem do WhatsApp de 2025-11-12 à(s) 21.17.02_dd8c889b.jpg',
    '/Imagem do WhatsApp de 2025-11-13 à(s) 08.33.24_774312dc.jpg',
    '/Imagem do WhatsApp de 2025-11-13 à(s) 10.34.06_3f21d1c6.jpg',
  ];

  // 🔹 Link que abre o app do mapa / Google Maps com a localização correta
  const mapsUrl =
    'https://www.google.com/maps/search/?api=1&query=-28.276497,-49.162848';

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
      <Header title="🍹 Drinks da Sorte" />

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">

        {/* 🔥 BOTÃO NO INÍCIO DA PÁGINA */}
        <div className="flex justify-center pb-2">
          <Button
            onClick={() => navigate('/buscar-premios')}
            variant="primary"
            fullWidth
          >
            🎁 Buscar Meus Prêmios
          </Button>
        </div>

        <Carousel images={images} />

        <Card>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">Nosso Grupo Exclusivo</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            Ganhe <strong>PIX</strong>, <strong>Bebidas Nacionais e Importadas</strong> (Whisks, Licores) e <strong>Sorteios de Carnes e Kits Churrasco!</strong>
          </p>

          <div className="space-y-3">
            <div className="bg-green-50 p-3 rounded-lg border-l-4 border-green-500">
              <p className="text-sm text-green-900">
                <strong>Sorteios:</strong> Após sorteios do Jogo do Bicho - RJ (Canal da Felicidade) às 09:30, 11:30, 14:30, 16:30, 18:30 e 21:30. <strong>25 números (01 a 25)</strong> com figuras de animais.
              </p>
            </div>

            <div className="bg-amber-50 p-3 rounded-lg border-l-4 border-amber-500">
              <p className="text-sm text-amber-900">
                <strong>Retiradas:</strong> Avisar antes. Prazo de 2 meses (prêmios) e 1 mês (carnes). Horários: Seg-Sex 18:30-20:00 | Sábado 10:00-11:00.
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Nos Siga nas Redes</h2>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              href="https://www.instagram.com/drinkdasortebn/"
              variant="instagram"
              fullWidth
            >
              <div className="flex items-center justify-center gap-2">
                <Instagram size={24} />
                <span>Instagram</span>
              </div>
            </Button>

            <Button
              href="https://chat.whatsapp.com/IA5LIslhi04AymIzBpf5X7"
              variant="whatsapp"
              fullWidth
            >
              <div className="flex items-center justify-center gap-2">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                <span>Grupo VIP WhatsApp</span>
              </div>
            </Button>
          </div>
        </Card>

        <Card>
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <MapPin className="text-green-600" />
            Nossa Localização
          </h2>

          {/* 🗺️ MAPA CLICÁVEL – abre app de mapa / Google Maps */}
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full h-64 sm:h-96 rounded-lg overflow-hidden shadow-inner"
          >
            <div className="relative w-full h-full">
              <iframe
                src="https://www.google.com/maps?q=-28.276497,-49.162848&z=18&output=embed"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Localização Drinks da Sorte"
                className="w-full h-full pointer-events-none"
              />
              <div className="absolute bottom-2 right-2 bg-white/90 text-xs px-2 py-1 rounded shadow">
                Toque para abrir no mapa
              </div>
            </div>
          </a>

          <p className="text-gray-600 text-center mt-4 text-sm">
            Drinks da Sorte - Clique no mapa para navegar até nós!
          </p>
        </Card>
      </main>
    </div>
  );
}
