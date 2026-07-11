/* ============================================
   COMEX SFPC - Dashboard Gerencial
   63º Batalhão de Infantaria
   Lógica: Dados, Cálculos, Gráficos, Filtros
   ============================================ */

// ── Embedded Data (parsed from CSV) ──────────────────────────
const RAW_DATA = [
  {
    "tipo": "IMPORTAÇÃO",
    "produto": "Tecido Balístico - Lâmina de Polietileno Não Alveolar (UHMWPE)",
    "categoria": "Tecido/Escudo Balístico",
    "quantidade": 472,
    "moeda": "UN",
    "valor": 373824.0,
    "liLpcoNum": "I2600351792",
    "cidade": "Itajaí",
    "localDesembaraco": "Multilog",
    "localFull": "MULTILOG LOGISTICA E SERVICOS LTDA, Rod. Antônio Heil, 4999 - Itaipava, Itajaí - SC, 88316-003",
    "empresa": "BTG Pactual",
    "empresaFull": "BTG PACTUAL COMMODITIES SERTRADING S.A.",
    "dataSolicitacao": "2026-06-26",
    "dataInspecao": "2026-07-06",
    "fiscal": "Guilherme Rosa Balester",
    "pgFiscal": "2° Ten",
    "tipoDoc": "LPCO",
    "duimpOuLi": "DUIMP",
    "numDuimpLi": "26BR0001003283-6"
  },
  {
    "tipo": "IMPORTAÇÃO",
    "produto": "Tecido Balístico - Lâmina de Polietileno Não Alveolar (UHMWPE)",
    "categoria": "Tecido/Escudo Balístico",
    "quantidade": 472,
    "moeda": "UN",
    "valor": 373824.0,
    "liLpcoNum": "I2600351816",
    "cidade": "Itajaí",
    "localDesembaraco": "Multilog",
    "localFull": "MULTILOG LOGISTICA E SERVICOS LTDA, Rod. Antônio Heil, 4999 - Itaipava, Itajaí - SC, 88316-003",
    "empresa": "BTG Pactual",
    "empresaFull": "BTG PACTUAL COMMODITIES SERTRADING S.A.",
    "dataSolicitacao": "2026-06-25",
    "dataInspecao": "2026-07-02",
    "fiscal": "Guilherme Rosa Balester",
    "pgFiscal": "2° Ten",
    "tipoDoc": "LPCO",
    "duimpOuLi": "DUIMP",
    "numDuimpLi": "26BR0000997105-0"
  },
  {
    "tipo": "IMPORTAÇÃO",
    "produto": "Armas de Pressão (AirgUN 4.5mm e Lançadores de Paintball .50)",
    "categoria": "Armas de Pressão",
    "quantidade": 2562,
    "moeda": "UN",
    "valor": 31228.2,
    "liLpcoNum": "I2600453770",
    "cidade": "Itajaí",
    "localDesembaraco": "CLIA - Localfrio",
    "localFull": "CLIA - LOCALFRIO S.A. ARMAZÉNS GERAIS FRIGORÍFICOS. R. Francisco Reis, 1205 - Cordeiros, Itajaí - SC, 88311-710",
    "empresa": "Link Comercial",
    "empresaFull": "LINK COMERCIAL IMPORTADORA E EXPORTADORA LTDA",
    "dataSolicitacao": "2026-06-11",
    "dataInspecao": "2026-06-29",
    "fiscal": "Guilherme Rosa Balester",
    "pgFiscal": "2° Ten",
    "tipoDoc": "LPCO",
    "duimpOuLi": "DUIMP",
    "numDuimpLi": "26BR0000319916-0"
  },
  {
    "tipo": "IMPORTAÇÃO",
    "produto": "Armas de Pressão (AirgUN 4.5mm e Lançadores de Paintball .50)",
    "categoria": "Armas de Pressão",
    "quantidade": 2550,
    "moeda": "UN",
    "valor": 31074.0,
    "liLpcoNum": "I2600453360",
    "cidade": "Itajaí",
    "localDesembaraco": "CLIA - Localfrio",
    "localFull": "CLIA - LOCALFRIO S.A. ARMAZÉNS GERAIS FRIGORÍFICOS. R. Francisco Reis, 1205 - Cordeiros, Itajaí - SC, 88311-710",
    "empresa": "Link Comercial",
    "empresaFull": "LINK COMERCIAL IMPORTADORA E EXPORTADORA LTDA",
    "dataSolicitacao": "2026-06-11",
    "dataInspecao": "2026-06-29",
    "fiscal": "Guilherme Rosa Balester",
    "pgFiscal": "2° Ten",
    "tipoDoc": "LPCO",
    "duimpOuLi": "DUIMP",
    "numDuimpLi": "26BR0000620057-6"
  },
  {
    "tipo": "IMPORTAÇÃO",
    "produto": "Equipamento de Visão Termal (Zenmuse H30T)",
    "categoria": "Visão Noturna / Termal",
    "quantidade": 3,
    "moeda": "UN",
    "valor": 15540.0,
    "liLpcoNum": "26/1211963-0",
    "cidade": "Florianópolis",
    "localDesembaraco": "Aeroporto de Florianópolis",
    "localFull": "Aeroporto Internacional de Florianópolis, rua Hércules - Carianos, Florianópolis - SC, 88047-902",
    "empresa": "Intelbras",
    "empresaFull": "INTELBRAS S.A. INDUSTRIA DE TELECOMUNICACAO ELETRONICA BRASILEIRA",
    "dataSolicitacao": "2026-06-09",
    "dataInspecao": "2026-06-29",
    "fiscal": "Guilherme Rosa Balester",
    "pgFiscal": "2° Ten",
    "tipoDoc": "LI",
    "duimpOuLi": "LI",
    "numDuimpLi": "26/1211963-0"
  },
  {
    "tipo": "IMPORTAÇÃO",
    "produto": "Tecido Balístico - Lâmina de Polietileno Não Alveolar (UHMWPE)",
    "categoria": "Tecido/Escudo Balístico",
    "quantidade": 472,
    "moeda": "UN",
    "valor": 373824.0,
    "liLpcoNum": "I2600351119",
    "cidade": "Itajaí",
    "localDesembaraco": "Multilog",
    "localFull": "MULTILOG LOGISTICA E SERVICOS LTDA, Rod. Antônio Heil, 4999 - Itaipava, Itajaí - SC, 88316-003",
    "empresa": "BTG Pactual",
    "empresaFull": "BTG PACTUAL COMMODITIES SERTRADING S.A.",
    "dataSolicitacao": "2026-06-10",
    "dataInspecao": "2026-06-22",
    "fiscal": "Guilherme Rosa Balester",
    "pgFiscal": "2° Ten",
    "tipoDoc": "LPCO",
    "duimpOuLi": "DUIMP",
    "numDuimpLi": "26BR0000845417-6"
  },
  {
    "tipo": "IMPORTAÇÃO",
    "produto": "Tecido Balístico - Lâmina de Polietileno Não Alveolar (UHMWPE)",
    "categoria": "Tecido/Escudo Balístico",
    "quantidade": 236,
    "moeda": "UN",
    "valor": 186912.0,
    "liLpcoNum": "I2600348797",
    "cidade": "Itajaí",
    "localDesembaraco": "Multilog",
    "localFull": "MULTILOG LOGISTICA E SERVICOS LTDA, Rod. Antônio Heil, 4999 - Itaipava, Itajaí - SC, 88316-003",
    "empresa": "BTG Pactual",
    "empresaFull": "BTG PACTUAL COMMODITIES SERTRADING S.A.",
    "dataSolicitacao": "2026-06-10",
    "dataInspecao": "2026-06-22",
    "fiscal": "Guilherme Rosa Balester",
    "pgFiscal": "2° Ten",
    "tipoDoc": "LPCO",
    "duimpOuLi": "DUIMP",
    "numDuimpLi": "26BR0000846073-7"
  },
  {
    "tipo": "IMPORTAÇÃO",
    "produto": "Tecido Balístico - Lâmina de Polietileno Não Alveolar (UHMWPE)",
    "categoria": "Tecido/Escudo Balístico",
    "quantidade": 472,
    "moeda": "UN",
    "valor": 373824.0,
    "liLpcoNum": "I2600348545",
    "cidade": "Itajaí",
    "localDesembaraco": "Multilog",
    "localFull": "MULTILOG LOGISTICA E SERVICOS LTDA, Rod. Antônio Heil, 4999 - Itaipava, Itajaí - SC, 88316-003",
    "empresa": "BTG Pactual",
    "empresaFull": "BTG PACTUAL COMMODITIES SERTRADING S.A.",
    "dataSolicitacao": "2026-06-10",
    "dataInspecao": "2026-06-22",
    "fiscal": "Guilherme Rosa Balester",
    "pgFiscal": "2° Ten",
    "tipoDoc": "LPCO",
    "duimpOuLi": "DUIMP",
    "numDuimpLi": "26BR0000909047-0"
  },
  {
    "tipo": "IMPORTAÇÃO",
    "produto": "Armas de pressão por ação de mola e gás  comprimido (PCP), todas no calibre 5.5 mm,  marca Artemis. A carga é composta pelos  seguintes modelos: Carabina NITRO Black Hawk  SR1000S (JUNgle Ed. e Wood Ed.), NITRO  GR1000X Black Hawk Mag, NITRO GR1600W  Falcon, PCP PR900W G2, PCP PR900S G2, PCP  M25 ThUNder Black, PCP M25W ThUNder Classic  e PCP T-REX BULLPUP",
    "categoria": "Armas de Pressão",
    "quantidade": 3692,
    "moeda": "UN",
    "valor": 169578.0,
    "liLpcoNum": "26/0322835-0",
    "cidade": "Itajaí",
    "localDesembaraco": "Poly Terminais",
    "localFull": "Poly Terminais Portuários S.A., av. José Luiz Marcelino, 1400 - Bairro Barra do Rio, Itajaí - SC, 88305-001",
    "empresa": "Fixxar",
    "empresaFull": "FIXXAR COMERCIO IMPORTACAO E EXPORTACAO LTDA",
    "dataSolicitacao": "2026-06-05",
    "dataInspecao": "2026-06-16",
    "fiscal": "Guilherme Rosa Balester",
    "pgFiscal": "2° Ten",
    "tipoDoc": "LI",
    "duimpOuLi": "LI",
    "numDuimpLi": "26/0322835-0"
  },
  {
    "tipo": "IMPORTAÇÃO",
    "produto": "APARELHOS DE RADIODETECÇÃO E DE RADIOSSONDAGEM (RADAR) RADAR DE CONTROLE DE TIRO, MODELO STIR 1.2 DIRECTOR, S/N 002. (Ordem: 9.1.0050 / NCM: 8526.10.00)",
    "categoria": "Radar de Controle de Tiro",
    "quantidade": 1,
    "moeda": "UN",
    "valor": 5955471.2,
    "liLpcoNum": "I2600357020",
    "cidade": "Itajaí",
    "localDesembaraco": "Poly Terminais",
    "localFull": "Poly Terminais Portuários S.A., av. José Luiz Marcelino, 1400 - Bairro Barra do Rio, Itajaí - SC, 88305-001",
    "empresa": "Águas Azuis",
    "empresaFull": "AGUAS AZUIS CONSTRUCAO NAVAL SPE LTDA",
    "dataSolicitacao": "2026-06-08",
    "dataInspecao": "2026-06-16",
    "fiscal": "Guilherme Rosa Balester",
    "pgFiscal": "2° Ten",
    "tipoDoc": "LPCO",
    "duimpOuLi": "DUIMP",
    "numDuimpLi": "26BR0000805010-5"
  },
  {
    "tipo": "IMPORTAÇÃO",
    "produto": "Armas de pressão",
    "categoria": "Armas de Pressão",
    "quantidade": 30,
    "moeda": "UN",
    "valor": 2548.8,
    "liLpcoNum": "26/0608280-1",
    "cidade": "Florianópolis",
    "localDesembaraco": "Aeroporto de Florianópolis",
    "localFull": "Aeroporto Internacional de Florianópolis, rua Hércules - Carianos, Florianópolis - SC, 88047-902",
    "empresa": "Grupo MGL",
    "empresaFull": "GRUPO MGL COMERCIO INTERNACIONAL LTDA",
    "dataSolicitacao": "2026-05-25",
    "dataInspecao": "2026-06-09",
    "fiscal": "Guilherme Rosa Balester",
    "pgFiscal": "2° Ten",
    "tipoDoc": "LI",
    "duimpOuLi": "LI",
    "numDuimpLi": "26/0608280-1"
  },
  {
    "tipo": "IMPORTAÇÃO",
    "produto": "Armas de pressão",
    "categoria": "Armas de Pressão",
    "quantidade": 90,
    "moeda": "UN",
    "valor": 11819.1,
    "liLpcoNum": "26/0608549-5",
    "cidade": "Florianópolis",
    "localDesembaraco": "Aeroporto de Florianópolis",
    "localFull": "Aeroporto Internacional de Florianópolis, rua Hércules - Carianos, Florianópolis - SC, 88047-902",
    "empresa": "Grupo MGL",
    "empresaFull": "GRUPO MGL COMERCIO INTERNACIONAL LTDA",
    "dataSolicitacao": "2026-05-25",
    "dataInspecao": "2026-06-09",
    "fiscal": "Guilherme Rosa Balester",
    "pgFiscal": "2° Ten",
    "tipoDoc": "LI",
    "duimpOuLi": "LI",
    "numDuimpLi": "26/0608549-5"
  },
  {
    "tipo": "IMPORTAÇÃO",
    "produto": "Armas de pressão",
    "categoria": "Armas de Pressão",
    "quantidade": 12,
    "moeda": "UN",
    "valor": 551.6,
    "liLpcoNum": "26/0606616-4",
    "cidade": "Florianópolis",
    "localDesembaraco": "Aeroporto de Florianópolis",
    "localFull": "Aeroporto Internacional de Florianópolis, rua Hércules - Carianos, Florianópolis - SC, 88047-902",
    "empresa": "Grupo MGL",
    "empresaFull": "GRUPO MGL COMERCIO INTERNACIONAL LTDA",
    "dataSolicitacao": "2026-05-25",
    "dataInspecao": "2026-06-09",
    "fiscal": "Guilherme Rosa Balester",
    "pgFiscal": "2° Ten",
    "tipoDoc": "LI",
    "duimpOuLi": "LI",
    "numDuimpLi": "26/0606616-4"
  },
  {
    "tipo": "IMPORTAÇÃO",
    "produto": "Arma de fogo",
    "categoria": "Armas de Fogo",
    "quantidade": 100,
    "moeda": "UN",
    "valor": 38950.0,
    "liLpcoNum": "26BR0000547034-0",
    "cidade": "Florianópolis",
    "localDesembaraco": "Aeroporto de Florianópolis",
    "localFull": "Aeroporto Internacional de Florianópolis, rua Hércules - Carianos, Florianópolis - SC, 88047-902",
    "empresa": "R&T Comércio",
    "empresaFull": "R & T COMERCIO DE IMPORTACAO E EXPORTACAO LTDA",
    "dataSolicitacao": "2026-05-22",
    "dataInspecao": "2026-05-26",
    "fiscal": "",
    "pgFiscal": "",
    "tipoDoc": "LPCO",
    "duimpOuLi": "",
    "numDuimpLi": ""
  },
  {
    "tipo": "IMPORTAÇÃO",
    "produto": "TECIDO BALÍSTICO",
    "categoria": "Tecido/Escudo Balístico",
    "quantidade": 236,
    "moeda": "UN",
    "valor": 186912.0,
    "liLpcoNum": "DUIMP 26BR0000357234-0",
    "cidade": "Itajaí",
    "localDesembaraco": "Multilog",
    "localFull": "MULTILOG LOGISTICA E SERVICOS LTDA, Rod. Antônio Heil, 4999 - Itaipava, Itajaí - SC, 88316-003",
    "empresa": "BTG Pactual",
    "empresaFull": "BTG PACTUAL COMMODITIES SERTRADING S.A.",
    "dataSolicitacao": "2026-05-21",
    "dataInspecao": "2026-05-25",
    "fiscal": "",
    "pgFiscal": "",
    "tipoDoc": "LPCO",
    "duimpOuLi": "",
    "numDuimpLi": ""
  },
  {
    "tipo": "IMPORTAÇÃO",
    "produto": "Arma de pressão",
    "categoria": "Armas de Pressão",
    "quantidade": 3300,
    "moeda": "UN",
    "valor": 77616.8,
    "liLpcoNum": "26BR0000265276-6",
    "cidade": "Itajaí",
    "localDesembaraco": "Multilog",
    "localFull": "MULTILOG LOGISTICA E SERVICOS LTDA, Rod. Antônio Heil, 4999 - Itaipava, Itajaí - SC, 88316-003",
    "empresa": "Ascensus Trading",
    "empresaFull": "ASCENSUS TRADING & LOGISTICA LTDA",
    "dataSolicitacao": "2026-05-19",
    "dataInspecao": "2026-05-21",
    "fiscal": "",
    "pgFiscal": "",
    "tipoDoc": "LPCO",
    "duimpOuLi": "",
    "numDuimpLi": ""
  },
  {
    "tipo": "IMPORTAÇÃO",
    "produto": "Arma de pressão",
    "categoria": "Armas de Pressão",
    "quantidade": 4601,
    "moeda": "UN",
    "valor": 0.0,
    "liLpcoNum": "DUIMP 26BR0000986521-0",
    "cidade": "Itajaí",
    "localDesembaraco": "Poly Terminais",
    "localFull": "Poly Terminais Portuários S.A., av. José Luiz Marcelino, 1400 - Bairro Barra do Rio, Itajaí - SC, 88305-001",
    "empresa": "Fixxar",
    "empresaFull": "FIXXAR COMERCIO IMPORTACAO E EXPORTACAO LTDA",
    "dataSolicitacao": "2026-05-18",
    "dataInspecao": "2026-05-19",
    "fiscal": "",
    "pgFiscal": "",
    "tipoDoc": "LPCO",
    "duimpOuLi": "",
    "numDuimpLi": ""
  },
  {
    "tipo": "IMPORTAÇÃO",
    "produto": "SISTEMA DE LANÇAMENTO DE MISSEIS AEREO",
    "categoria": "Sistemas de Mísseis",
    "quantidade": 1,
    "moeda": "UN",
    "valor": 12733271.26,
    "liLpcoNum": "DUIMP 26BR0000040125-1",
    "cidade": "Itajaí",
    "localDesembaraco": "Poly Terminais",
    "localFull": "Poly Terminais Portuários S.A., av. José Luiz Marcelino, 1400 - Bairro Barra do Rio, Itajaí - SC, 88305-001",
    "empresa": "Águas Azuis",
    "empresaFull": "ÁGUAS AZUIS CONSTRUÇÃO NAVAL SPE LTDA",
    "dataSolicitacao": "2026-05-12",
    "dataInspecao": "2026-05-13",
    "fiscal": "",
    "pgFiscal": "",
    "tipoDoc": "LPCO",
    "duimpOuLi": "",
    "numDuimpLi": ""
  },
  {
    "tipo": "IMPORTAÇÃO",
    "produto": "Munição de uso restrito",
    "categoria": "Munições e Projéteis",
    "quantidade": 0,
    "moeda": "UN",
    "valor": 15525.0,
    "liLpcoNum": "DUIMP 26BR0000518695-2",
    "cidade": "Florianópolis",
    "localDesembaraco": "Aeroporto de Florianópolis",
    "localFull": "Aeroporto Internacional de Florianópolis, rua Hércules - Carianos, Florianópolis - SC, 88047-902",
    "empresa": "SWBR",
    "empresaFull": "SWBR COMERCIO, IMPORTACAO E EXPORTACAO DE ARTIGOS ESPORTIVOS LTDA",
    "dataSolicitacao": "2026-05-08",
    "dataInspecao": "2026-05-12",
    "fiscal": "",
    "pgFiscal": "",
    "tipoDoc": "LPCO",
    "duimpOuLi": "",
    "numDuimpLi": ""
  },
  {
    "tipo": "IMPORTAÇÃO",
    "produto": "1.1.0090 - Réplica ou simulacro de arma de fogo",
    "categoria": "Armas de Fogo",
    "quantidade": 6000,
    "moeda": "UN",
    "valor": 2280.12,
    "liLpcoNum": "26/0267204-3",
    "cidade": "Florianópolis",
    "localDesembaraco": "Aeroporto de Florianópolis",
    "localFull": "Aeroporto Internacional de Florianópolis, rua Hércules - Carianos, Florianópolis - SC, 88047-902",
    "empresa": "PCSC (Polícia Civil)",
    "empresaFull": "POLICIA CIVIL DO ESTADO DE SANTA CATARINA (PCSC)",
    "dataSolicitacao": "2026-05-04",
    "dataInspecao": "2026-05-08",
    "fiscal": "",
    "pgFiscal": "",
    "tipoDoc": "LI",
    "duimpOuLi": "",
    "numDuimpLi": ""
  },
  {
    "tipo": "IMPORTAÇÃO",
    "produto": "ARMA DE FOGO SEMIAUTOMÁTICA DE USO PERMITIDO",
    "categoria": "Armas de Fogo",
    "quantidade": 120,
    "moeda": "UN",
    "valor": 54666.74,
    "liLpcoNum": "26/0756196-7",
    "cidade": "Florianópolis",
    "localDesembaraco": "Poly Terminais",
    "localFull": "Poly Terminais Portuários S.A., av. José Luiz Marcelino, 1400 - Bairro Barra do Rio, Itajaí - SC, 88305-001",
    "empresa": "Grupo MGL",
    "empresaFull": "GRUPO MGL COMERCIO INTERNACIONAL LTDA",
    "dataSolicitacao": "2026-05-04",
    "dataInspecao": "2026-05-06",
    "fiscal": "",
    "pgFiscal": "",
    "tipoDoc": "LI",
    "duimpOuLi": "",
    "numDuimpLi": ""
  },
  {
    "tipo": "IMPORTAÇÃO",
    "produto": "ARMA DE FOGO SEMI AUTOMATICA DE USO RESTRITO",
    "categoria": "Armas de Fogo",
    "quantidade": 375,
    "moeda": "UN",
    "valor": 104805.0,
    "liLpcoNum": "26/0689410-5",
    "cidade": "Florianópolis",
    "localDesembaraco": "Aeroporto de Florianópolis",
    "localFull": "Aeroporto Internacional de Florianópolis, rua Hércules - Carianos, Florianópolis - SC, 88047-902",
    "empresa": "PCSC (Polícia Civil)",
    "empresaFull": "FUNDO DE MELHORIA DA POLICIA CIVIL - FUMPC",
    "dataSolicitacao": "2026-05-04",
    "dataInspecao": "2026-05-06",
    "fiscal": "",
    "pgFiscal": "",
    "tipoDoc": "LI",
    "duimpOuLi": "",
    "numDuimpLi": ""
  },
  {
    "tipo": "IMPORTAÇÃO",
    "produto": "ARMAS DE PRESSÃO",
    "categoria": "Armas de Pressão",
    "quantidade": 4184,
    "moeda": "UN",
    "valor": 283799.05,
    "liLpcoNum": "26/0059334-0",
    "cidade": "Itajaí",
    "localDesembaraco": "Poly Terminais",
    "localFull": "Poly Terminais Portuários S.A., av. José Luiz Marcelino, 1400 - Bairro Barra do Rio, Itajaí - SC, 88305-001",
    "empresa": "Fixxar",
    "empresaFull": "FIXXAR COMERCIO IMPORTACAO E EXPORTACAO LTDA",
    "dataSolicitacao": "2026-04-29",
    "dataInspecao": "2026-05-04",
    "fiscal": "",
    "pgFiscal": "",
    "tipoDoc": "LI",
    "duimpOuLi": "",
    "numDuimpLi": ""
  },
  {
    "tipo": "IMPORTAÇÃO",
    "produto": "METRALHADORA REMOTAMENTE CONTROLADA CALIBRE 12,7MM (.50)",
    "categoria": "Armamento Pesado",
    "quantidade": 2,
    "moeda": "UN",
    "valor": 1941444.82,
    "liLpcoNum": "26BR0000499384-6",
    "cidade": "Florianópolis",
    "localDesembaraco": "Aeroporto de Florianópolis",
    "localFull": "Aeroporto Internacional de Florianópolis, rua Hércules - Carianos, Florianópolis - SC, 88047-902",
    "empresa": "Águas Azuis",
    "empresaFull": "ÁGUAS AZUIS CONSTRUÇÃO NAVAL SPE LTDA",
    "dataSolicitacao": "2026-04-29",
    "dataInspecao": "2026-05-04",
    "fiscal": "",
    "pgFiscal": "",
    "tipoDoc": "LPCO",
    "duimpOuLi": "",
    "numDuimpLi": ""
  },
  {
    "tipo": "IMPORTAÇÃO",
    "produto": "ARMAS DE PRESSÃO",
    "categoria": "Armas de Pressão",
    "quantidade": 3922,
    "moeda": "UN",
    "valor": 334271.94,
    "liLpcoNum": "26/10347083",
    "cidade": "Itajaí",
    "localDesembaraco": "Poly Terminais",
    "localFull": "Poly Terminais Portuários S.A., av. José Luiz Marcelino, 1400 - Bairro Barra do Rio, Itajaí - SC, 88305-001",
    "empresa": "Fixxar",
    "empresaFull": "FIXXAR COMERCIO IMPORTACAO E EXPORTACAO LTDA",
    "dataSolicitacao": "2026-05-04",
    "dataInspecao": "2026-05-04",
    "fiscal": "",
    "pgFiscal": "",
    "tipoDoc": "LI",
    "duimpOuLi": "",
    "numDuimpLi": ""
  },
  {
    "tipo": "IMPORTAÇÃO",
    "produto": "Arma de pressão",
    "categoria": "Armas de Pressão",
    "quantidade": 0,
    "moeda": "UN",
    "valor": 149870.5,
    "liLpcoNum": "26/0059211-5",
    "cidade": "Itajaí",
    "localDesembaraco": "Poly Terminais",
    "localFull": "Poly Terminais Portuários S.A., av. José Luiz Marcelino, 1400 - Bairro Barra do Rio, Itajaí - SC, 88305-001",
    "empresa": "Fixxar",
    "empresaFull": "FIXXAR COMERCIO IMPORTACAO E EXPORTACAO LTDA",
    "dataSolicitacao": "2026-04-23",
    "dataInspecao": "2026-04-28",
    "fiscal": "",
    "pgFiscal": "",
    "tipoDoc": "LI",
    "duimpOuLi": "",
    "numDuimpLi": ""
  },
  {
    "tipo": "IMPORTAÇÃO",
    "produto": "Tecido Balístico",
    "categoria": "Tecido/Escudo Balístico",
    "quantidade": 472,
    "moeda": "UN",
    "valor": 373824.0,
    "liLpcoNum": "26/0057602-0",
    "cidade": "Itajaí",
    "localDesembaraco": "Multilog",
    "localFull": "MULTILOG LOGISTICA E SERVICOS LTDA, Rod. Antônio Heil, 4999 - Itaipava, Itajaí - SC, 88316-003",
    "empresa": "BTG Pactual",
    "empresaFull": "BTG PACTUAL COMMODITIES SERTRADING S.A.",
    "dataSolicitacao": "2026-04-24",
    "dataInspecao": "2026-04-28",
    "fiscal": "",
    "pgFiscal": "",
    "tipoDoc": "LI",
    "duimpOuLi": "",
    "numDuimpLi": ""
  },
  {
    "tipo": "IMPORTAÇÃO",
    "produto": "Arma de pressão",
    "categoria": "Armas de Pressão",
    "quantidade": 3400,
    "moeda": "UN",
    "valor": 103610.0,
    "liLpcoNum": "26/0921782-1",
    "cidade": "Navegantes",
    "localDesembaraco": "Portonave",
    "localFull": "Portonave S/A",
    "empresa": "Amadeo Rossi",
    "empresaFull": "AMADEO ROSSI IMPORTACAO E DISTRIBUICAO DE ARTIGOS ESPORTIVOS LTDA",
    "dataSolicitacao": "2026-04-27",
    "dataInspecao": "2026-04-28",
    "fiscal": "",
    "pgFiscal": "",
    "tipoDoc": "LI",
    "duimpOuLi": "",
    "numDuimpLi": ""
  },
  {
    "tipo": "IMPORTAÇÃO",
    "produto": "Arma de pressão",
    "categoria": "Armas de Pressão",
    "quantidade": 5500,
    "moeda": "UN",
    "valor": 146325.0,
    "liLpcoNum": "26/0922140-3",
    "cidade": "Navegantes",
    "localDesembaraco": "Portonave",
    "localFull": "Portonave S/A",
    "empresa": "Amadeo Rossi",
    "empresaFull": "AMADEO ROSSI IMPORTACAO E DISTRIBUICAO DE ARTIGOS ESPORTIVOS LTDA",
    "dataSolicitacao": "2026-04-27",
    "dataInspecao": "2026-04-28",
    "fiscal": "",
    "pgFiscal": "",
    "tipoDoc": "LI",
    "duimpOuLi": "",
    "numDuimpLi": ""
  },
  {
    "tipo": "IMPORTAÇÃO",
    "produto": "Arma de fogo de uso permitido e restrito (.308 e .22)",
    "categoria": "Armas de Fogo",
    "quantidade": 304,
    "moeda": "UN",
    "valor": 59643.64,
    "liLpcoNum": "26BR0000340281-0",
    "cidade": "Florianópolis",
    "localDesembaraco": "Aeroporto de Florianópolis",
    "localFull": "Aeroporto Internacional de Florianópolis, rua Hércules - Carianos, Florianópolis - SC, 88047-902",
    "empresa": "GT 122 COMERCIO E IMPORTACAO L...",
    "empresaFull": "GT 122 COMERCIO E IMPORTACAO LTDA.",
    "dataSolicitacao": "2026-04-22",
    "dataInspecao": "2026-04-27",
    "fiscal": "",
    "pgFiscal": "",
    "tipoDoc": "LPCO",
    "duimpOuLi": "",
    "numDuimpLi": ""
  },
  {
    "tipo": "IMPORTAÇÃO",
    "produto": "Tecido Balístico",
    "categoria": "Tecido/Escudo Balístico",
    "quantidade": 472,
    "moeda": "UN",
    "valor": 373824.0,
    "liLpcoNum": "25/4774848-9",
    "cidade": "Itajaí",
    "localDesembaraco": "Multilog",
    "localFull": "MULTILOG LOGISTICA E SERVICOS LTDA, Rod. Antônio Heil, 4999 - Itaipava, Itajaí - SC, 88316-003",
    "empresa": "BTG Pactual",
    "empresaFull": "BTG PACTUAL COMMODITIES SERTRADING S.A.",
    "dataSolicitacao": "2026-04-22",
    "dataInspecao": "2026-04-23",
    "fiscal": "",
    "pgFiscal": "",
    "tipoDoc": "LI",
    "duimpOuLi": "",
    "numDuimpLi": ""
  },
  {
    "tipo": "IMPORTAÇÃO",
    "produto": "Arma de pressão",
    "categoria": "Armas de Pressão",
    "quantidade": 3840,
    "moeda": "UN",
    "valor": 202363.2,
    "liLpcoNum": "26/0922393-7",
    "cidade": "Navegantes",
    "localDesembaraco": "Portonave",
    "localFull": "Portonave S/A",
    "empresa": "Amadeo Rossi",
    "empresaFull": "AMADEO ROSSI IMPORTACAO E DISTRIBUICAO DE ARTIGOS ESPORTIVOS LTDA",
    "dataSolicitacao": "2026-04-13",
    "dataInspecao": "2026-04-15",
    "fiscal": "",
    "pgFiscal": "",
    "tipoDoc": "LI",
    "duimpOuLi": "",
    "numDuimpLi": ""
  },
  {
    "tipo": "IMPORTAÇÃO",
    "produto": "Munição de uso restrito",
    "categoria": "Munições e Projéteis",
    "quantidade": 0,
    "moeda": "UN",
    "valor": 54954.0,
    "liLpcoNum": "26/0206798-0",
    "cidade": "Florianópolis",
    "localDesembaraco": "Aeroporto de Florianópolis",
    "localFull": "Aeroporto Internacional de Florianópolis, rua Hércules - Carianos, Florianópolis - SC, 88047-902",
    "empresa": "SRV Comércio",
    "empresaFull": "SRV COMÉRCIO DE IMPORTAÇÃO E EXPORTAÇÃO LTDA.",
    "dataSolicitacao": "2026-04-13",
    "dataInspecao": "2026-04-15",
    "fiscal": "",
    "pgFiscal": "",
    "tipoDoc": "LI",
    "duimpOuLi": "",
    "numDuimpLi": ""
  },
  {
    "tipo": "IMPORTAÇÃO",
    "produto": "Arma de pressão",
    "categoria": "Armas de Pressão",
    "quantidade": 0,
    "moeda": "UN",
    "valor": 134720.0,
    "liLpcoNum": "26/1171353-9",
    "cidade": "Itajaí",
    "localDesembaraco": "CLIA - Localfrio",
    "localFull": "CLIA - LOCALFRIO S.A. ARMAZÉNS GERAIS FRIGORÍFICOS. R. Francisco Reis, 1205 - Cordeiros, Itajaí - SC, 88311-710",
    "empresa": "Capital Trade",
    "empresaFull": "CAPITAL TRADE IMPORTACAO E EXPORTACAO LTDA",
    "dataSolicitacao": "2026-04-10",
    "dataInspecao": "2026-04-15",
    "fiscal": "",
    "pgFiscal": "",
    "tipoDoc": "LI",
    "duimpOuLi": "",
    "numDuimpLi": ""
  },
  {
    "tipo": "IMPORTAÇÃO",
    "produto": "Arma de pressão",
    "categoria": "Armas de Pressão",
    "quantidade": 2588,
    "moeda": "UN",
    "valor": 58801.0,
    "liLpcoNum": "26BR0000260049-9",
    "cidade": "Itajaí",
    "localDesembaraco": "Multilog",
    "localFull": "MULTILOG LOGISTICA E SERVICOS LTDA, Rod. Antônio Heil, 4999 - Itaipava, Itajaí - SC, 88316-003",
    "empresa": "Ascensus Trading",
    "empresaFull": "ASCENSUS TRADING & LOGISTICA LTDA",
    "dataSolicitacao": "2026-04-10",
    "dataInspecao": "2026-04-13",
    "fiscal": "",
    "pgFiscal": "",
    "tipoDoc": "LPCO",
    "duimpOuLi": "",
    "numDuimpLi": ""
  },
  {
    "tipo": "IMPORTAÇÃO",
    "produto": "Espoleta para munição",
    "categoria": "Munições e Projéteis",
    "quantidade": 0,
    "moeda": "UN",
    "valor": 42809.01,
    "liLpcoNum": "26/0477053-0",
    "cidade": "Florianópolis",
    "localDesembaraco": "Aeroporto de Florianópolis",
    "localFull": "Aeroporto Internacional de Florianópolis, rua Hércules - Carianos, Florianópolis - SC, 88047-902",
    "empresa": "SHOOTINGS LTDA",
    "empresaFull": "SHOOTINGS LTDA",
    "dataSolicitacao": "2026-04-06",
    "dataInspecao": "2026-04-09",
    "fiscal": "",
    "pgFiscal": "",
    "tipoDoc": "LI",
    "duimpOuLi": "",
    "numDuimpLi": ""
  },
  {
    "tipo": "IMPORTAÇÃO",
    "produto": "Munição de uso restrito",
    "categoria": "Munições e Projéteis",
    "quantidade": 0,
    "moeda": "UN",
    "valor": 54954.0,
    "liLpcoNum": "26/0206798-0",
    "cidade": "Florianópolis",
    "localDesembaraco": "Aeroporto de Florianópolis",
    "localFull": "Aeroporto Internacional de Florianópolis, rua Hércules - Carianos, Florianópolis - SC, 88047-902",
    "empresa": "SRV Comércio",
    "empresaFull": "SRV COMÉRCIO DE IMPORTAÇÃO E EXPORTAÇÃO LTDA.",
    "dataSolicitacao": "2026-04-06",
    "dataInspecao": "2026-04-09",
    "fiscal": "",
    "pgFiscal": "",
    "tipoDoc": "LI",
    "duimpOuLi": "",
    "numDuimpLi": ""
  },
  {
    "tipo": "IMPORTAÇÃO",
    "produto": "Arma de pressão",
    "categoria": "Armas de Pressão",
    "quantidade": 4900,
    "moeda": "UN",
    "valor": 73500.0,
    "liLpcoNum": "25/4648511-5",
    "cidade": "Navegantes",
    "localDesembaraco": "Portonave",
    "localFull": "Portonave S/A",
    "empresa": "Amadeo Rossi",
    "empresaFull": "AMADEO ROSSI IMPORTACAO E DISTRIBUICAO DE ARTIGOS ESPORTIVOS LTDA",
    "dataSolicitacao": "2026-04-06",
    "dataInspecao": "2026-04-08",
    "fiscal": "",
    "pgFiscal": "",
    "tipoDoc": "LI",
    "duimpOuLi": "",
    "numDuimpLi": ""
  },
  {
    "tipo": "IMPORTAÇÃO",
    "produto": "Trietanolamina",
    "categoria": "Trietanolamina",
    "quantidade": 0,
    "moeda": "KG",
    "valor": 51888.0,
    "liLpcoNum": "26/0077582-1",
    "cidade": "Navegantes",
    "localDesembaraco": "Portonave",
    "localFull": "Portonave S/A",
    "empresa": "Komport",
    "empresaFull": "KOMPORT COMERCIAL IMPORTADORA S.A.",
    "dataSolicitacao": "2026-04-06",
    "dataInspecao": "2026-04-08",
    "fiscal": "",
    "pgFiscal": "",
    "tipoDoc": "LI",
    "duimpOuLi": "",
    "numDuimpLi": ""
  },
  {
    "tipo": "IMPORTAÇÃO",
    "produto": "Arma de pressão",
    "categoria": "Armas de Pressão",
    "quantidade": 1800,
    "moeda": "UN",
    "valor": 61200.0,
    "liLpcoNum": "26/0028414-3",
    "cidade": "Itajaí",
    "localDesembaraco": "Poly Terminais",
    "localFull": "Poly Terminais Portuários S.A., av. José Luiz Marcelino, 1400 - Bairro Barra do Rio, Itajaí - SC, 88305-001",
    "empresa": "Fixxar",
    "empresaFull": "FIXXAR COMERCIO IMPORTACAO E EXPORTACAO LTDA",
    "dataSolicitacao": "2026-04-06",
    "dataInspecao": "2026-04-08",
    "fiscal": "",
    "pgFiscal": "",
    "tipoDoc": "LI",
    "duimpOuLi": "",
    "numDuimpLi": ""
  },
  {
    "tipo": "IMPORTAÇÃO",
    "produto": "Arma de pressão",
    "categoria": "Armas de Pressão",
    "quantidade": 0,
    "moeda": "UN",
    "valor": 141440.0,
    "liLpcoNum": "25/4546116-6",
    "cidade": "Itajaí",
    "localDesembaraco": "CLIA - Localfrio",
    "localFull": "CLIA - LOCALFRIO S.A. ARMAZÉNS GERAIS FRIGORÍFICOS. R. Francisco Reis, 1205 - Cordeiros, Itajaí - SC, 88311-710",
    "empresa": "Capital Trade",
    "empresaFull": "CAPITAL TRADE IMPORTACAO E EXPORTACAO LTDA",
    "dataSolicitacao": "2026-04-06",
    "dataInspecao": "2026-04-06",
    "fiscal": "",
    "pgFiscal": "",
    "tipoDoc": "LI",
    "duimpOuLi": "",
    "numDuimpLi": ""
  },
  {
    "tipo": "IMPORTAÇÃO",
    "produto": "Arma de pressão",
    "categoria": "Armas de Pressão",
    "quantidade": 4131,
    "moeda": "UN",
    "valor": 349396.65,
    "liLpcoNum": "26/0537262-8",
    "cidade": "Itajaí",
    "localDesembaraco": "Poly Terminais",
    "localFull": "Poly Terminais Portuários S.A., av. José Luiz Marcelino, 1400 - Bairro Barra do Rio, Itajaí - SC, 88305-001",
    "empresa": "Fixxar",
    "empresaFull": "FIXXAR COMERCIO IMPORTACAO E EXPORTACAO LTDA",
    "dataSolicitacao": "2026-03-30",
    "dataInspecao": "2026-04-01",
    "fiscal": "",
    "pgFiscal": "",
    "tipoDoc": "LI",
    "duimpOuLi": "",
    "numDuimpLi": ""
  },
  {
    "tipo": "IMPORTAÇÃO",
    "produto": "Tecido Balístico",
    "categoria": "Tecido/Escudo Balístico",
    "quantidade": 236,
    "moeda": "UN",
    "valor": 186912.0,
    "liLpcoNum": "I2600198774",
    "cidade": "Itajaí",
    "localDesembaraco": "Multilog",
    "localFull": "MULTILOG LOGISTICA E SERVICOS LTDA, Rod. Antônio Heil, 4999 - Itaipava, Itajaí - SC, 88316-003",
    "empresa": "BTG Pactual",
    "empresaFull": "BTG PACTUAL COMMODITIES SERTRADING S.A.",
    "dataSolicitacao": "2026-03-30",
    "dataInspecao": "2026-04-01",
    "fiscal": "",
    "pgFiscal": "",
    "tipoDoc": "LPCO",
    "duimpOuLi": "",
    "numDuimpLi": ""
  },
  {
    "tipo": "IMPORTAÇÃO",
    "produto": "Trietanolamina 99%",
    "categoria": "Trietanolamina",
    "quantidade": 0,
    "moeda": "KG",
    "valor": 25944.0,
    "liLpcoNum": "25/4815971-1",
    "cidade": "Navegantes",
    "localDesembaraco": "Portonave",
    "localFull": "Portonave S/A",
    "empresa": "Komport",
    "empresaFull": "KOMPORT COMERCIAL IMPORTADORA S.A.",
    "dataSolicitacao": "2026-03-23",
    "dataInspecao": "2026-03-30",
    "fiscal": "",
    "pgFiscal": "",
    "tipoDoc": "LI",
    "duimpOuLi": "",
    "numDuimpLi": ""
  },
  {
    "tipo": "IMPORTAÇÃO",
    "produto": "Trietanolamina 85%",
    "categoria": "Trietanolamina",
    "quantidade": 0,
    "moeda": "KG",
    "valor": 51888.0,
    "liLpcoNum": "25/4815922-3",
    "cidade": "Navegantes",
    "localDesembaraco": "Portonave",
    "localFull": "Portonave S/A",
    "empresa": "Komport",
    "empresaFull": "KOMPORT COMERCIAL IMPORTADORA S.A.",
    "dataSolicitacao": "2026-03-23",
    "dataInspecao": "2026-03-30",
    "fiscal": "",
    "pgFiscal": "",
    "tipoDoc": "LI",
    "duimpOuLi": "",
    "numDuimpLi": ""
  },
  {
    "tipo": "IMPORTAÇÃO",
    "produto": "Arma de Fogo Semi-automática de uso permitido (Pistola)",
    "categoria": "Armas de Fogo",
    "quantidade": 150,
    "moeda": "UN",
    "valor": 58125.0,
    "liLpcoNum": "26/0934084-4",
    "cidade": "Florianópolis",
    "localDesembaraco": "Aeroporto de Florianópolis",
    "localFull": "Aeroporto Internacional de Florianópolis, rua Hércules - Carianos, Florianópolis - SC, 88047-902",
    "empresa": "R&T Comércio",
    "empresaFull": "R & T COMERCIO DE IMPORTACAO E EXPORTACAO",
    "dataSolicitacao": "2026-03-23",
    "dataInspecao": "2026-03-30",
    "fiscal": "",
    "pgFiscal": "",
    "tipoDoc": "LI",
    "duimpOuLi": "",
    "numDuimpLi": ""
  },
  {
    "tipo": "IMPORTAÇÃO",
    "produto": "Arma de pressão",
    "categoria": "Armas de Pressão",
    "quantidade": 339,
    "moeda": "UN",
    "valor": 86488.12,
    "liLpcoNum": "25/4759137-7",
    "cidade": "Blumenau",
    "localDesembaraco": "Recinto Próprio",
    "localFull": "Empresa do importador",
    "empresa": "Fixxar",
    "empresaFull": "FIXXAR COMERCIO IMPORTACAO E EXPORTACAO",
    "dataSolicitacao": "2026-03-24",
    "dataInspecao": "2026-03-26",
    "fiscal": "",
    "pgFiscal": "",
    "tipoDoc": "LI",
    "duimpOuLi": "",
    "numDuimpLi": ""
  },
  {
    "tipo": "IMPORTAÇÃO",
    "produto": "Arma de pressão",
    "categoria": "Armas de Pressão",
    "quantidade": 56,
    "moeda": "UN",
    "valor": 26072.0,
    "liLpcoNum": "26/0213189-1",
    "cidade": "Florianópolis",
    "localDesembaraco": "Aeroporto de Florianópolis",
    "localFull": "Aeroporto Internacional de Florianópolis, rua Hércules - Carianos, Florianópolis - SC, 88047-902",
    "empresa": "DMT Importadora",
    "empresaFull": "DMT IMPORTADORA LTDA",
    "dataSolicitacao": "2026-03-23",
    "dataInspecao": "2026-03-25",
    "fiscal": "",
    "pgFiscal": "",
    "tipoDoc": "LI",
    "duimpOuLi": "",
    "numDuimpLi": ""
  },
  {
    "tipo": "IMPORTAÇÃO",
    "produto": "Arma de pressão",
    "categoria": "Armas de Pressão",
    "quantidade": 19,
    "moeda": "UN",
    "valor": 9281.41,
    "liLpcoNum": "26/0213183-2",
    "cidade": "Florianópolis",
    "localDesembaraco": "Aeroporto de Florianópolis",
    "localFull": "Aeroporto Internacional de Florianópolis, rua Hércules - Carianos, Florianópolis - SC, 88047-902",
    "empresa": "DMT Importadora",
    "empresaFull": "DMT IMPORTADORA LTDA",
    "dataSolicitacao": "2026-03-23",
    "dataInspecao": "2026-03-25",
    "fiscal": "",
    "pgFiscal": "",
    "tipoDoc": "LI",
    "duimpOuLi": "",
    "numDuimpLi": ""
  },
  {
    "tipo": "IMPORTAÇÃO",
    "produto": "Armamento Pesado",
    "categoria": "Armamento Pesado",
    "quantidade": 1,
    "moeda": "UN",
    "valor": 1282277.39,
    "liLpcoNum": "25/4174414-7",
    "cidade": "Itajaí",
    "localDesembaraco": "Poly Terminais",
    "localFull": "Poly Terminais Portuários S.A., av. José Luiz Marcelino, 1400 - Bairro Barra do Rio, Itajaí - SC, 88305-001",
    "empresa": "Águas Azuis",
    "empresaFull": "AGUAS AZUIS CONSTRUCAO NAVAL SPE LTDA",
    "dataSolicitacao": "2026-03-23",
    "dataInspecao": "2026-03-24",
    "fiscal": "",
    "pgFiscal": "",
    "tipoDoc": "LI",
    "duimpOuLi": "",
    "numDuimpLi": ""
  },
  {
    "tipo": "IMPORTAÇÃO",
    "produto": "Trietanolamina 85%",
    "categoria": "Trietanolamina",
    "quantidade": 0,
    "moeda": "KG",
    "valor": 24288.0,
    "liLpcoNum": "25/4785547-1",
    "cidade": "Itajaí",
    "localDesembaraco": "Multilog",
    "localFull": "MULTILOG LOGISTICA E SERVICOS LTDA, Rod. Antônio Heil, 4999 - Itaipava, Itajaí - SC, 88316-003",
    "empresa": "Catarinense Química",
    "empresaFull": "COMERCIAL CATARINENSE QUIMICA E",
    "dataSolicitacao": "2026-03-23",
    "dataInspecao": "2026-03-24",
    "fiscal": "",
    "pgFiscal": "",
    "tipoDoc": "LI",
    "duimpOuLi": "",
    "numDuimpLi": ""
  },
  {
    "tipo": "IMPORTAÇÃO",
    "produto": "Arma de pressão",
    "categoria": "Armas de Pressão",
    "quantidade": 0,
    "moeda": "UN",
    "valor": 276269.1,
    "liLpcoNum": "26/0353133-8",
    "cidade": "Itajaí",
    "localDesembaraco": "Poly Terminais",
    "localFull": "Poly Terminais Portuários S.A., av. José Luiz Marcelino, 1400 - Bairro Barra do Rio, Itajaí - SC, 88305-001",
    "empresa": "Fixxar",
    "empresaFull": "FIXXAR COMERCIO IMPORTACAO E EXPORTACAO",
    "dataSolicitacao": "2026-03-18",
    "dataInspecao": "2026-03-23",
    "fiscal": "",
    "pgFiscal": "",
    "tipoDoc": "LI",
    "duimpOuLi": "",
    "numDuimpLi": ""
  },
  {
    "tipo": "IMPORTAÇÃO",
    "produto": "Arma de pressão",
    "categoria": "Armas de Pressão",
    "quantidade": 702,
    "moeda": "UN",
    "valor": 113935.23,
    "liLpcoNum": "25/4727109-7",
    "cidade": "Itajaí",
    "localDesembaraco": "Poly Terminais",
    "localFull": "Poly Terminais Portuários S.A., av. José Luiz Marcelino, 1400 - Bairro Barra do Rio, Itajaí - SC, 88305-001",
    "empresa": "Fixxar",
    "empresaFull": "FIXXAR COMERCIO IMPORTACAO E EXPORTACAO",
    "dataSolicitacao": "2026-03-17",
    "dataInspecao": "2026-03-19",
    "fiscal": "",
    "pgFiscal": "",
    "tipoDoc": "LI",
    "duimpOuLi": "",
    "numDuimpLi": ""
  },
  {
    "tipo": "IMPORTAÇÃO",
    "produto": "Arma de Fogo Semi-automática de uso restrito (Pistola)",
    "categoria": "Armas de Fogo",
    "quantidade": 216,
    "moeda": "UN",
    "valor": 69984.0,
    "liLpcoNum": "25/4428976-9",
    "cidade": "Florianópolis",
    "localDesembaraco": "Aeroporto de Florianópolis",
    "localFull": "Aeroporto Internacional de Florianópolis, rua Hércules - Carianos, Florianópolis - SC, 88047-902",
    "empresa": "Município de Sorocaba",
    "empresaFull": "MUNICIPIO DE SOROCABA",
    "dataSolicitacao": "2026-03-13",
    "dataInspecao": "2026-03-18",
    "fiscal": "",
    "pgFiscal": "",
    "tipoDoc": "LI",
    "duimpOuLi": "",
    "numDuimpLi": ""
  },
  {
    "tipo": "IMPORTAÇÃO",
    "produto": "Arma de pressão",
    "categoria": "Armas de Pressão",
    "quantidade": 339,
    "moeda": "UN",
    "valor": 86488.12,
    "liLpcoNum": "25/4759137-7",
    "cidade": "Blumenau",
    "localDesembaraco": "Recinto Próprio",
    "localFull": "Empresa do importador",
    "empresa": "Fixxar",
    "empresaFull": "FIXXAR COMERCIO IMPORTACAO E EXPORTACAO",
    "dataSolicitacao": "2026-03-10",
    "dataInspecao": "2026-03-12",
    "fiscal": "",
    "pgFiscal": "",
    "tipoDoc": "LI",
    "duimpOuLi": "",
    "numDuimpLi": ""
  },
  {
    "tipo": "IMPORTAÇÃO",
    "produto": "Arma de pressão",
    "categoria": "Armas de Pressão",
    "quantidade": 6155,
    "moeda": "UN",
    "valor": 0.0,
    "liLpcoNum": "25/4706428-8",
    "cidade": "Navegantes",
    "localDesembaraco": "Portonave",
    "localFull": "Portonave S/A",
    "empresa": "Amadeo Rossi",
    "empresaFull": "AMADEO ROSSI IMP E DIST DE ARTIGOS ESPORTIVOS LTDA",
    "dataSolicitacao": "2026-03-06",
    "dataInspecao": "2026-03-09",
    "fiscal": "",
    "pgFiscal": "",
    "tipoDoc": "LI",
    "duimpOuLi": "",
    "numDuimpLi": ""
  },
  {
    "tipo": "IMPORTAÇÃO",
    "produto": "Arma de Fogo Semi-automática de uso restrito (Carabina Fuzil)",
    "categoria": "Armas de Fogo",
    "quantidade": 60,
    "moeda": "UN",
    "valor": 37254.9,
    "liLpcoNum": "26/0503725-0",
    "cidade": "Florianópolis",
    "localDesembaraco": "Aeroporto de Florianópolis",
    "localFull": "Aeroporto Internacional de Florianópolis, rua Hércules - Carianos, Florianópolis - SC, 88047-902",
    "empresa": "Grupo MGL",
    "empresaFull": "GRUPO MGL COMERCIO INTERNACIONAL LTDA",
    "dataSolicitacao": "2026-03-02",
    "dataInspecao": "2026-03-05",
    "fiscal": "",
    "pgFiscal": "",
    "tipoDoc": "LI",
    "duimpOuLi": "",
    "numDuimpLi": ""
  },
  {
    "tipo": "IMPORTAÇÃO",
    "produto": "Equipamento para visão noturna ou termal",
    "categoria": "Visão Noturna / Termal",
    "quantidade": 9,
    "moeda": "UN",
    "valor": 46620.0,
    "liLpcoNum": "26/0258406-3",
    "cidade": "Florianópolis",
    "localDesembaraco": "Aeroporto de Florianópolis",
    "localFull": "Aeroporto Internacional de Florianópolis, rua Hércules - Carianos, Florianópolis - SC, 88047-902",
    "empresa": "Intelbras",
    "empresaFull": "INTELBRAS S.A. INDÚSTRIA DE TELECOMUNICAÇÃO",
    "dataSolicitacao": "2026-03-04",
    "dataInspecao": "2026-03-05",
    "fiscal": "",
    "pgFiscal": "",
    "tipoDoc": "LI",
    "duimpOuLi": "",
    "numDuimpLi": ""
  },
  {
    "tipo": "IMPORTAÇÃO",
    "produto": "Arma de Fogo Semi-automática de uso restrito (Carabina Fuzil)",
    "categoria": "Armas de Fogo",
    "quantidade": 168,
    "moeda": "UN",
    "valor": 677215.2,
    "liLpcoNum": "26/0649262-7",
    "cidade": "Florianópolis",
    "localDesembaraco": "Aeroporto de Florianópolis",
    "localFull": "Aeroporto Internacional de Florianópolis, rua Hércules - Carianos, Florianópolis - SC, 88047-902",
    "empresa": "SSP/SC (Secretaria de Segurança)",
    "empresaFull": "SECRETARIA DE ESTADO DA SEGURANÇA PÚBLICA",
    "dataSolicitacao": "2026-03-02",
    "dataInspecao": "2026-03-03",
    "fiscal": "",
    "pgFiscal": "",
    "tipoDoc": "LI",
    "duimpOuLi": "",
    "numDuimpLi": ""
  },
  {
    "tipo": "IMPORTAÇÃO",
    "produto": "Arma de Fogo Semi-automática de uso restrito (Carabina Fuzil)",
    "categoria": "Armas de Fogo",
    "quantidade": 151,
    "moeda": "UN",
    "valor": 642329.4,
    "liLpcoNum": "26/0649193-0",
    "cidade": "Florianópolis",
    "localDesembaraco": "Aeroporto de Florianópolis",
    "localFull": "Aeroporto Internacional de Florianópolis, rua Hércules - Carianos, Florianópolis - SC, 88047-902",
    "empresa": "SSP/SC (Secretaria de Segurança)",
    "empresaFull": "SECRETARIA DE ESTADO DA SEGURANÇA PÚBLICA",
    "dataSolicitacao": "2026-03-02",
    "dataInspecao": "2026-03-03",
    "fiscal": "",
    "pgFiscal": "",
    "tipoDoc": "LI",
    "duimpOuLi": "",
    "numDuimpLi": ""
  },
  {
    "tipo": "IMPORTAÇÃO",
    "produto": "Arma de Fogo Semi-automática de uso restrito (Carabina Fuzil)",
    "categoria": "Armas de Fogo",
    "quantidade": 38,
    "moeda": "UN",
    "valor": 160170.0,
    "liLpcoNum": "26/0503715-2",
    "cidade": "Florianópolis",
    "localDesembaraco": "Aeroporto de Florianópolis",
    "localFull": "Aeroporto Internacional de Florianópolis, rua Hércules - Carianos, Florianópolis - SC, 88047-902",
    "empresa": "SSP/SC (Secretaria de Segurança)",
    "empresaFull": "SECRETARIA DE ESTADO DA SEGURANÇA PÚBLICA",
    "dataSolicitacao": "2026-03-02",
    "dataInspecao": "2026-03-03",
    "fiscal": "",
    "pgFiscal": "",
    "tipoDoc": "LI",
    "duimpOuLi": "",
    "numDuimpLi": ""
  },
  {
    "tipo": "IMPORTAÇÃO",
    "produto": "Arma de Fogo Semi-automática de uso restrito (Carabina Fuzil)",
    "categoria": "Armas de Fogo",
    "quantidade": 32,
    "moeda": "UN",
    "valor": 135314.4,
    "liLpcoNum": "26/0503770-5",
    "cidade": "Florianópolis",
    "localDesembaraco": "Aeroporto de Florianópolis",
    "localFull": "Aeroporto Internacional de Florianópolis, rua Hércules - Carianos, Florianópolis - SC, 88047-902",
    "empresa": "SSP/SC (Secretaria de Segurança)",
    "empresaFull": "SECRETARIA DE ESTADO DA SEGURANÇA PÚBLICA",
    "dataSolicitacao": "2026-03-02",
    "dataInspecao": "2026-03-03",
    "fiscal": "",
    "pgFiscal": "",
    "tipoDoc": "LI",
    "duimpOuLi": "",
    "numDuimpLi": ""
  },
  {
    "tipo": "IMPORTAÇÃO",
    "produto": "Arma de Fogo Semi-automática de uso restrito (Carabina Fuzil)",
    "categoria": "Armas de Fogo",
    "quantidade": 42,
    "moeda": "UN",
    "valor": 188650.8,
    "liLpcoNum": "26/0503749-7",
    "cidade": "Florianópolis",
    "localDesembaraco": "Aeroporto de Florianópolis",
    "localFull": "Aeroporto Internacional de Florianópolis, rua Hércules - Carianos, Florianópolis - SC, 88047-902",
    "empresa": "SSP/SC (Secretaria de Segurança)",
    "empresaFull": "SECRETARIA DE ESTADO DA SEGURANÇA PÚBLICA",
    "dataSolicitacao": "2026-03-02",
    "dataInspecao": "2026-03-03",
    "fiscal": "",
    "pgFiscal": "",
    "tipoDoc": "LI",
    "duimpOuLi": "",
    "numDuimpLi": ""
  },
  {
    "tipo": "IMPORTAÇÃO",
    "produto": "Arma de Fogo Semi-automática de uso restrito (Carabina Fuzil)",
    "categoria": "Armas de Fogo",
    "quantidade": 230,
    "moeda": "UN",
    "valor": 1120835.34,
    "liLpcoNum": "26/0503779-9",
    "cidade": "Florianópolis",
    "localDesembaraco": "Aeroporto de Florianópolis",
    "localFull": "Aeroporto Internacional de Florianópolis, rua Hércules - Carianos, Florianópolis - SC, 88047-902",
    "empresa": "SSP/SC (Secretaria de Segurança)",
    "empresaFull": "SECRETARIA DE ESTADO DA SEGURANÇA PÚBLICA",
    "dataSolicitacao": "2026-03-02",
    "dataInspecao": "2026-03-03",
    "fiscal": "",
    "pgFiscal": "",
    "tipoDoc": "LI",
    "duimpOuLi": "",
    "numDuimpLi": ""
  },
  {
    "tipo": "IMPORTAÇÃO",
    "produto": "Arma de Fogo Semi-automática de uso restrito (Carabina Fuzil)",
    "categoria": "Armas de Fogo",
    "quantidade": 171,
    "moeda": "UN",
    "valor": 711629.02,
    "liLpcoNum": "26/0503722-5",
    "cidade": "Florianópolis",
    "localDesembaraco": "Aeroporto de Florianópolis",
    "localFull": "Aeroporto Internacional de Florianópolis, rua Hércules - Carianos, Florianópolis - SC, 88047-902",
    "empresa": "SSP/SC (Secretaria de Segurança)",
    "empresaFull": "SECRETARIA DE ESTADO DA SEGURANÇA PÚBLICA",
    "dataSolicitacao": "2026-03-02",
    "dataInspecao": "2026-03-03",
    "fiscal": "",
    "pgFiscal": "",
    "tipoDoc": "LI",
    "duimpOuLi": "",
    "numDuimpLi": ""
  },
  {
    "tipo": "IMPORTAÇÃO",
    "produto": "Arma de Fogo Semi-automática de uso restrito (Carabina Fuzil)",
    "categoria": "Armas de Fogo",
    "quantidade": 17,
    "moeda": "UN",
    "valor": 11103.37,
    "liLpcoNum": "26/0503703-9",
    "cidade": "Florianópolis",
    "localDesembaraco": "Aeroporto de Florianópolis",
    "localFull": "Aeroporto Internacional de Florianópolis, rua Hércules - Carianos, Florianópolis - SC, 88047-902",
    "empresa": "SSP/SC (Secretaria de Segurança)",
    "empresaFull": "SECRETARIA DE ESTADO DA SEGURANÇA PÚBLICA",
    "dataSolicitacao": "2026-03-02",
    "dataInspecao": "2026-03-03",
    "fiscal": "",
    "pgFiscal": "",
    "tipoDoc": "LI",
    "duimpOuLi": "",
    "numDuimpLi": ""
  },
  {
    "tipo": "IMPORTAÇÃO",
    "produto": "Arma de Fogo Semi-automática de uso restrito (Carabina Fuzil)",
    "categoria": "Armas de Fogo",
    "quantidade": 13,
    "moeda": "UN",
    "valor": 27449.87,
    "liLpcoNum": "26/0503739-0",
    "cidade": "Florianópolis",
    "localDesembaraco": "Aeroporto de Florianópolis",
    "localFull": "Aeroporto Internacional de Florianópolis, rua Hércules - Carianos, Florianópolis - SC, 88047-902",
    "empresa": "SSP/SC (Secretaria de Segurança)",
    "empresaFull": "SECRETARIA DE ESTADO DA SEGURANÇA PÚBLICA",
    "dataSolicitacao": "2026-03-02",
    "dataInspecao": "2026-03-03",
    "fiscal": "",
    "pgFiscal": "",
    "tipoDoc": "LI",
    "duimpOuLi": "",
    "numDuimpLi": ""
  },
  {
    "tipo": "IMPORTAÇÃO",
    "produto": "Arma de Fogo Semi-automática de uso restrito (Carabina Fuzil)",
    "categoria": "Armas de Fogo",
    "quantidade": 13,
    "moeda": "UN",
    "valor": 25019.97,
    "liLpcoNum": "26/0503743-8",
    "cidade": "Florianópolis",
    "localDesembaraco": "Aeroporto de Florianópolis",
    "localFull": "Aeroporto Internacional de Florianópolis, rua Hércules - Carianos, Florianópolis - SC, 88047-902",
    "empresa": "SSP/SC (Secretaria de Segurança)",
    "empresaFull": "SECRETARIA DE ESTADO DA SEGURANÇA PÚBLICA",
    "dataSolicitacao": "2026-03-02",
    "dataInspecao": "2026-03-03",
    "fiscal": "",
    "pgFiscal": "",
    "tipoDoc": "LI",
    "duimpOuLi": "",
    "numDuimpLi": ""
  },
  {
    "tipo": "IMPORTAÇÃO",
    "produto": "Arma de Fogo Semi-automática de uso restrito (Carabina Fuzil)",
    "categoria": "Armas de Fogo",
    "quantidade": 34,
    "moeda": "UN",
    "valor": 65573.55,
    "liLpcoNum": "26/0503761-6",
    "cidade": "Florianópolis",
    "localDesembaraco": "Aeroporto de Florianópolis",
    "localFull": "Aeroporto Internacional de Florianópolis, rua Hércules - Carianos, Florianópolis - SC, 88047-902",
    "empresa": "SSP/SC (Secretaria de Segurança)",
    "empresaFull": "SECRETARIA DE ESTADO DA SEGURANÇA PÚBLICA",
    "dataSolicitacao": "2026-03-02",
    "dataInspecao": "2026-03-03",
    "fiscal": "",
    "pgFiscal": "",
    "tipoDoc": "LI",
    "duimpOuLi": "",
    "numDuimpLi": ""
  },
  {
    "tipo": "IMPORTAÇÃO",
    "produto": "Arma de Fogo Semi-automática de uso restrito (Carabina Fuzil)",
    "categoria": "Armas de Fogo",
    "quantidade": 6,
    "moeda": "UN",
    "valor": 10070.55,
    "liLpcoNum": "26/0503746-2",
    "cidade": "Florianópolis",
    "localDesembaraco": "Aeroporto de Florianópolis",
    "localFull": "Aeroporto Internacional de Florianópolis, rua Hércules - Carianos, Florianópolis - SC, 88047-902",
    "empresa": "SSP/SC (Secretaria de Segurança)",
    "empresaFull": "SECRETARIA DE ESTADO DA SEGURANÇA PÚBLICA",
    "dataSolicitacao": "2026-03-02",
    "dataInspecao": "2026-03-03",
    "fiscal": "",
    "pgFiscal": "",
    "tipoDoc": "LI",
    "duimpOuLi": "",
    "numDuimpLi": ""
  },
  {
    "tipo": "IMPORTAÇÃO",
    "produto": "Arma de Fogo Semi-automática de uso restrito (Carabina Fuzil)",
    "categoria": "Armas de Fogo",
    "quantidade": 6,
    "moeda": "UN",
    "valor": 1155.0,
    "liLpcoNum": "26/0503710-1",
    "cidade": "Florianópolis",
    "localDesembaraco": "Aeroporto de Florianópolis",
    "localFull": "Aeroporto Internacional de Florianópolis, rua Hércules - Carianos, Florianópolis - SC, 88047-902",
    "empresa": "SSP/SC (Secretaria de Segurança)",
    "empresaFull": "SECRETARIA DE ESTADO DA SEGURANÇA PÚBLICA",
    "dataSolicitacao": "2026-03-02",
    "dataInspecao": "2026-03-03",
    "fiscal": "",
    "pgFiscal": "",
    "tipoDoc": "LI",
    "duimpOuLi": "",
    "numDuimpLi": ""
  },
  {
    "tipo": "IMPORTAÇÃO",
    "produto": "Arma de pressão",
    "categoria": "Armas de Pressão",
    "quantidade": 372,
    "moeda": "UN",
    "valor": 19152.0,
    "liLpcoNum": "25/4658606-0",
    "cidade": "Itajaí",
    "localDesembaraco": "Poly Terminais",
    "localFull": "Poly Terminais Portuários S.A., av. José Luiz Marcelino, 1400 - Bairro Barra do Rio, Itajaí - SC, 88305-001",
    "empresa": "Fixxar",
    "empresaFull": "FIXXAR COMERCIO IMPORTACAO E EXPORTACAO LTDA",
    "dataSolicitacao": "2026-02-24",
    "dataInspecao": "2026-02-26",
    "fiscal": "",
    "pgFiscal": "",
    "tipoDoc": "LI",
    "duimpOuLi": "",
    "numDuimpLi": ""
  },
  {
    "tipo": "IMPORTAÇÃO",
    "produto": "Arma de pressão",
    "categoria": "Armas de Pressão",
    "quantidade": 702,
    "moeda": "UN",
    "valor": 113935.23,
    "liLpcoNum": "25/4727109-7",
    "cidade": "Itajaí",
    "localDesembaraco": "Poly Terminais",
    "localFull": "Poly Terminais Portuários S.A., av. José Luiz Marcelino, 1400 - Bairro Barra do Rio, Itajaí - SC, 88305-001",
    "empresa": "Fixxar",
    "empresaFull": "FIXXAR COMERCIO IMPORTACAO E EXPORTACAO LTDA",
    "dataSolicitacao": "2026-02-11",
    "dataInspecao": "2026-02-19",
    "fiscal": "",
    "pgFiscal": "",
    "tipoDoc": "LI",
    "duimpOuLi": "",
    "numDuimpLi": ""
  },
  {
    "tipo": "IMPORTAÇÃO",
    "produto": "Nitrato de potássio",
    "categoria": "Nitrato de Potássio",
    "quantidade": 0,
    "moeda": "KG",
    "valor": 33035.75,
    "liLpcoNum": "25/4400100-5",
    "cidade": "Itajaí",
    "localDesembaraco": "Poly Terminais",
    "localFull": "Poly Terminais Portuários S.A., av. José Luiz Marcelino, 1400 - Bairro Barra do Rio, Itajaí - SC, 88305-001",
    "empresa": "Unividros",
    "empresaFull": "UNIVIDROS COM E IND E IMPORTADORA DE VIDROS LTDA",
    "dataSolicitacao": "2026-02-13",
    "dataInspecao": "2026-02-19",
    "fiscal": "",
    "pgFiscal": "",
    "tipoDoc": "LI",
    "duimpOuLi": "",
    "numDuimpLi": ""
  },
  {
    "tipo": "IMPORTAÇÃO",
    "produto": "Trietanolamina (tri(2-hidroxietil) amina)",
    "categoria": "Trietanolamina",
    "quantidade": 0,
    "moeda": "KG",
    "valor": 30330.0,
    "liLpcoNum": "26/0203399-7",
    "cidade": "Itapoá",
    "localDesembaraco": "Porto de Itapoá",
    "localFull": "PORTO DE ITAPOA",
    "empresa": "Vox Comercial",
    "empresaFull": "VOX COMERCIAL IMPORTADORA E EXPORTADORA LTDA",
    "dataSolicitacao": "2026-02-05",
    "dataInspecao": "2026-02-11",
    "fiscal": "",
    "pgFiscal": "",
    "tipoDoc": "LI",
    "duimpOuLi": "",
    "numDuimpLi": ""
  },
  {
    "tipo": "IMPORTAÇÃO",
    "produto": "Arma de pressão",
    "categoria": "Armas de Pressão",
    "quantidade": 0,
    "moeda": "UN",
    "valor": 0.0,
    "liLpcoNum": "25/4390715-9",
    "cidade": "Navegantes",
    "localDesembaraco": "Portonave",
    "localFull": "Portonave S/A",
    "empresa": "Amadeo Rossi",
    "empresaFull": "AMADEO ROSSI IMPORTACAO E DISTRIBUICAO DE ARTIGOS ESPORTIVOS LTDA.",
    "dataSolicitacao": "2026-02-05",
    "dataInspecao": "2026-02-10",
    "fiscal": "",
    "pgFiscal": "",
    "tipoDoc": "LI",
    "duimpOuLi": "",
    "numDuimpLi": ""
  },
  {
    "tipo": "IMPORTAÇÃO",
    "produto": "Arma de pressão",
    "categoria": "Armas de Pressão",
    "quantidade": 0,
    "moeda": "UN",
    "valor": 274858.35,
    "liLpcoNum": "25/3718280-6",
    "cidade": "Itajaí",
    "localDesembaraco": "Poly Terminais",
    "localFull": "Poly Terminais Portuários S.A., av. José Luiz Marcelino, 1400 - Bairro Barra do Rio, Itajaí - SC, 88305-001",
    "empresa": "FIRST S/A",
    "empresaFull": "FIRST S/A",
    "dataSolicitacao": "2026-02-05",
    "dataInspecao": "2026-02-10",
    "fiscal": "",
    "pgFiscal": "",
    "tipoDoc": "LI",
    "duimpOuLi": "",
    "numDuimpLi": ""
  },
  {
    "tipo": "IMPORTAÇÃO",
    "produto": "Trietanolamina (tri(2-hidroxietil) amina) - 99%",
    "categoria": "Trietanolamina",
    "quantidade": 0,
    "moeda": "KG",
    "valor": 23368.0,
    "liLpcoNum": "25/3584347-3",
    "cidade": "Itajaí",
    "localDesembaraco": "Multilog",
    "localFull": "MULTILOG LOGISTICA E SERVICOS LTDA, Rod. Antônio Heil, 4999 - Itaipava, Itajaí - SC, 88316-003",
    "empresa": "Komport",
    "empresaFull": "KOMPORT COMERCIAL IMPORTADORA S.A.",
    "dataSolicitacao": "2026-02-06",
    "dataInspecao": "2026-02-10",
    "fiscal": "",
    "pgFiscal": "",
    "tipoDoc": "LI",
    "duimpOuLi": "",
    "numDuimpLi": ""
  },
  {
    "tipo": "IMPORTAÇÃO",
    "produto": "Trietanolamina (tri(2-hidroxietil) amina)",
    "categoria": "Trietanolamina",
    "quantidade": 0,
    "moeda": "KG",
    "valor": 46736.0,
    "liLpcoNum": "25/3735960-9",
    "cidade": "Itajaí",
    "localDesembaraco": "Multilog",
    "localFull": "MULTILOG LOGISTICA E SERVICOS LTDA, Rod. Antônio Heil, 4999 - Itaipava, Itajaí - SC, 88316-003",
    "empresa": "Komport",
    "empresaFull": "KOMPORT COMERCIAL IMPORTADORA S.A",
    "dataSolicitacao": "2026-02-06",
    "dataInspecao": "2026-02-10",
    "fiscal": "",
    "pgFiscal": "",
    "tipoDoc": "LI",
    "duimpOuLi": "",
    "numDuimpLi": ""
  },
  {
    "tipo": "IMPORTAÇÃO",
    "produto": "Trietanolamina (tri(2-hidroxietil) amina)",
    "categoria": "Trietanolamina",
    "quantidade": 0,
    "moeda": "KG",
    "valor": 30330.0,
    "liLpcoNum": "26/0203260-5",
    "cidade": "Navegantes",
    "localDesembaraco": "Portonave",
    "localFull": "Portonave S/A",
    "empresa": "Vox Comercial",
    "empresaFull": "VOX COMERCIAL IMPORTADORA E EXPORTADORA LTDA",
    "dataSolicitacao": "2026-02-03",
    "dataInspecao": "2026-02-09",
    "fiscal": "",
    "pgFiscal": "",
    "tipoDoc": "LI",
    "duimpOuLi": "",
    "numDuimpLi": ""
  },
  {
    "tipo": "IMPORTAÇÃO",
    "produto": "Arma de pressão",
    "categoria": "Armas de Pressão",
    "quantidade": 0,
    "moeda": "UN",
    "valor": 156393.45,
    "liLpcoNum": "25/2958397-0",
    "cidade": "Itajaí",
    "localDesembaraco": "Barra do Rio",
    "localFull": "BARRA DO RIO",
    "empresa": "Grupo MGL",
    "empresaFull": "GRUPO MGL COMERCIO INTERNACIONAL LTDA",
    "dataSolicitacao": "2026-02-05",
    "dataInspecao": "2026-02-09",
    "fiscal": "",
    "pgFiscal": "",
    "tipoDoc": "LI",
    "duimpOuLi": "",
    "numDuimpLi": ""
  },
  {
    "tipo": "IMPORTAÇÃO",
    "produto": "Arma de pressão",
    "categoria": "Armas de Pressão",
    "quantidade": 6,
    "moeda": "UN",
    "valor": 79680.0,
    "liLpcoNum": "25/4430952-2",
    "cidade": "Florianópolis",
    "localDesembaraco": "Aeroporto de Florianópolis",
    "localFull": "Aeroporto Internacional de Florianópolis, rua Hércules - Carianos, Florianópolis - SC, 88047-902",
    "empresa": "Grupo MGL",
    "empresaFull": "GRUPO MGL COMERCIO INTERNACIONAL LTDA",
    "dataSolicitacao": "2026-02-02",
    "dataInspecao": "2026-02-06",
    "fiscal": "",
    "pgFiscal": "",
    "tipoDoc": "LI",
    "duimpOuLi": "",
    "numDuimpLi": ""
  },
  {
    "tipo": "IMPORTAÇÃO",
    "produto": "Trietanolamina (tri(2-hidroxietil) amina)",
    "categoria": "Trietanolamina",
    "quantidade": 0,
    "moeda": "KG",
    "valor": 26220.0,
    "liLpcoNum": "26/0248673-8",
    "cidade": "Itapoá",
    "localDesembaraco": "CLIF",
    "localFull": "TERMINAL DO CLIF",
    "empresa": "Trathoimport",
    "empresaFull": "TRATHOIMPORT IMPORTACAO E EXPORTACAO SA",
    "dataSolicitacao": "2026-01-26",
    "dataInspecao": "2026-02-02",
    "fiscal": "",
    "pgFiscal": "",
    "tipoDoc": "LI",
    "duimpOuLi": "",
    "numDuimpLi": ""
  },
  {
    "tipo": "IMPORTAÇÃO",
    "produto": "Arma de pressão",
    "categoria": "Armas de Pressão",
    "quantidade": 7748,
    "moeda": "UN",
    "valor": 186919.16,
    "liLpcoNum": "25/4641790-0",
    "cidade": "Itajaí",
    "localDesembaraco": "Poly Terminais",
    "localFull": "Poly Terminais Portuários S.A., av. José Luiz Marcelino, 1400 - Bairro Barra do Rio, Itajaí - SC, 88305-001",
    "empresa": "Fixxar",
    "empresaFull": "FIXXAR COMERCIO IMPORTACAO E EXPORTACAO LTDA",
    "dataSolicitacao": "2026-01-26",
    "dataInspecao": "2026-01-29",
    "fiscal": "",
    "pgFiscal": "",
    "tipoDoc": "LI",
    "duimpOuLi": "",
    "numDuimpLi": ""
  },
  {
    "tipo": "IMPORTAÇÃO",
    "produto": "Arma de pressão",
    "categoria": "Armas de Pressão",
    "quantidade": 4084,
    "moeda": "UN",
    "valor": 345253.7,
    "liLpcoNum": "25/4645782-0",
    "cidade": "Itajaí",
    "localDesembaraco": "Poly Terminais",
    "localFull": "Poly Terminais Portuários S.A., av. José Luiz Marcelino, 1400 - Bairro Barra do Rio, Itajaí - SC, 88305-001",
    "empresa": "Fixxar",
    "empresaFull": "FIXXAR COMERCIO IMPORTACAO E EXPORTACAO LTDA",
    "dataSolicitacao": "2026-01-26",
    "dataInspecao": "2026-01-29",
    "fiscal": "",
    "pgFiscal": "",
    "tipoDoc": "LI",
    "duimpOuLi": "",
    "numDuimpLi": ""
  },
  {
    "tipo": "IMPORTAÇÃO",
    "produto": "Arma de pressão",
    "categoria": "Armas de Pressão",
    "quantidade": 3996,
    "moeda": "UN",
    "valor": 159766.4,
    "liLpcoNum": "25/4641431-5",
    "cidade": "Itajaí",
    "localDesembaraco": "Poly Terminais",
    "localFull": "Poly Terminais Portuários S.A., av. José Luiz Marcelino, 1400 - Bairro Barra do Rio, Itajaí - SC, 88305-001",
    "empresa": "Fixxar",
    "empresaFull": "FIXXAR COMERCIO IMPORTACAO E EXPORTACAO LTDA",
    "dataSolicitacao": "2026-01-26",
    "dataInspecao": "2026-01-29",
    "fiscal": "",
    "pgFiscal": "",
    "tipoDoc": "LI",
    "duimpOuLi": "",
    "numDuimpLi": ""
  },
  {
    "tipo": "IMPORTAÇÃO",
    "produto": "Arma de pressão",
    "categoria": "Armas de Pressão",
    "quantidade": 1312,
    "moeda": "UN",
    "valor": 217312.54,
    "liLpcoNum": "25/4656251-9",
    "cidade": "Itajaí",
    "localDesembaraco": "Poly Terminais",
    "localFull": "Poly Terminais Portuários S.A., av. José Luiz Marcelino, 1400 - Bairro Barra do Rio, Itajaí - SC, 88305-001",
    "empresa": "Fixxar",
    "empresaFull": "FIXXAR COMERCIO IMPORTACAO E EXPORTACAO LTDA",
    "dataSolicitacao": "2026-01-26",
    "dataInspecao": "2026-01-29",
    "fiscal": "",
    "pgFiscal": "",
    "tipoDoc": "LI",
    "duimpOuLi": "",
    "numDuimpLi": ""
  },
  {
    "tipo": "IMPORTAÇÃO",
    "produto": "MUNição de uso permitido - Cal.22",
    "categoria": "Munições e Projéteis",
    "quantidade": 240000,
    "moeda": "UN",
    "valor": 14790.0,
    "liLpcoNum": "26/0347387-7",
    "cidade": "Florianópolis",
    "localDesembaraco": "Aeroporto de Florianópolis",
    "localFull": "Aeroporto Internacional de Florianópolis, rua Hércules - Carianos, Florianópolis - SC, 88047-902",
    "empresa": "SRV Comércio",
    "empresaFull": "SRV COMÉRCIO DE IMPORTAÇÃO E EXPORTAÇÃO LTDA.",
    "dataSolicitacao": "2026-01-26",
    "dataInspecao": "2026-01-28",
    "fiscal": "",
    "pgFiscal": "",
    "tipoDoc": "LI",
    "duimpOuLi": "",
    "numDuimpLi": ""
  },
  {
    "tipo": "IMPORTAÇÃO",
    "produto": "Arma de fogo semi-automática de uso permitido (Pistola)",
    "categoria": "Armas de Fogo",
    "quantidade": 50,
    "moeda": "UN",
    "valor": 21700.25,
    "liLpcoNum": "26/0133896-4",
    "cidade": "Florianópolis",
    "localDesembaraco": "Aeroporto de Florianópolis",
    "localFull": "Aeroporto Internacional de Florianópolis, rua Hércules - Carianos, Florianópolis - SC, 88047-902",
    "empresa": "R&T Comércio",
    "empresaFull": "R & T COMÉRCIO DE IMPORTAÇÃO E EXPORTAÇÃO LTDA.",
    "dataSolicitacao": "2026-01-26",
    "dataInspecao": "2026-01-28",
    "fiscal": "",
    "pgFiscal": "",
    "tipoDoc": "LI",
    "duimpOuLi": "",
    "numDuimpLi": ""
  },
  {
    "tipo": "IMPORTAÇÃO",
    "produto": "Equipamento para visão noturna ou termal",
    "categoria": "Visão Noturna / Termal",
    "quantidade": 1,
    "moeda": "UN",
    "valor": 3437071.06,
    "liLpcoNum": "25/4164869-5",
    "cidade": "Itajaí",
    "localDesembaraco": "Poly Terminais",
    "localFull": "Poly Terminais Portuários S.A., av. José Luiz Marcelino, 1400 - Bairro Barra do Rio, Itajaí - SC, 88305-001",
    "empresa": "Águas Azuis",
    "empresaFull": "AGUAS AZUIS CONSTRUCAO NAVAL SPE LTDA",
    "dataSolicitacao": "2026-01-22",
    "dataInspecao": "2026-01-26",
    "fiscal": "",
    "pgFiscal": "",
    "tipoDoc": "LI",
    "duimpOuLi": "",
    "numDuimpLi": ""
  },
  {
    "tipo": "IMPORTAÇÃO",
    "produto": "Trietanolamina",
    "categoria": "Trietanolamina",
    "quantidade": 18400,
    "moeda": "KG",
    "valor": 24656.0,
    "liLpcoNum": "25/4203414-3",
    "cidade": "Itajaí",
    "localDesembaraco": "Multilog",
    "localFull": "MULTILOG LOGISTICA E SERVICOS LTDA, Rod. Antônio Heil, 4999 - Itaipava, Itajaí - SC, 88316-003",
    "empresa": "Catarinense Química",
    "empresaFull": "CCQM - COMERCIAL CATARINENSE QUIMICA E METAIS LTDA",
    "dataSolicitacao": "2026-01-22",
    "dataInspecao": "2026-01-26",
    "fiscal": "",
    "pgFiscal": "",
    "tipoDoc": "LI",
    "duimpOuLi": "",
    "numDuimpLi": ""
  },
  {
    "tipo": "IMPORTAÇÃO",
    "produto": "Escudo balístico de uso restrito",
    "categoria": "Tecido/Escudo Balístico",
    "quantidade": 1,
    "moeda": "UN",
    "valor": 0.0,
    "liLpcoNum": "25/3686323-0",
    "cidade": "Itajaí",
    "localDesembaraco": "Poly Terminais",
    "localFull": "Poly Terminais Portuários S.A., av. José Luiz Marcelino, 1400 - Bairro Barra do Rio, Itajaí - SC, 88305-001",
    "empresa": "Águas Azuis",
    "empresaFull": "AGUAS AZUIS CONSTRUCAO NAVAL SPE LTDA",
    "dataSolicitacao": "2026-01-13",
    "dataInspecao": "2026-01-19",
    "fiscal": "",
    "pgFiscal": "",
    "tipoDoc": "LI",
    "duimpOuLi": "",
    "numDuimpLi": ""
  },
  {
    "tipo": "IMPORTAÇÃO",
    "produto": "Arma de pressão",
    "categoria": "Armas de Pressão",
    "quantidade": 3554,
    "moeda": "UN",
    "valor": 275597.53,
    "liLpcoNum": "25/4658146-7",
    "cidade": "Itajaí",
    "localDesembaraco": "Poly Terminais",
    "localFull": "Poly Terminais Portuários S.A., av. José Luiz Marcelino, 1400 - Bairro Barra do Rio, Itajaí - SC, 88305-001",
    "empresa": "Águas Azuis",
    "empresaFull": "AGUAS AZUIS CONSTRUCAO NAVAL SPE LTDA",
    "dataSolicitacao": "2026-01-13",
    "dataInspecao": "2026-01-19",
    "fiscal": "",
    "pgFiscal": "",
    "tipoDoc": "LI",
    "duimpOuLi": "",
    "numDuimpLi": ""
  },
  {
    "tipo": "IMPORTAÇÃO",
    "produto": "Arma de pressão",
    "categoria": "Armas de Pressão",
    "quantidade": 4002,
    "moeda": "UN",
    "valor": 0.0,
    "liLpcoNum": "25/4038783-9",
    "cidade": "Navegantes",
    "localDesembaraco": "Portonave",
    "localFull": "Porto Nave S/A",
    "empresa": "Amadeo Rossi",
    "empresaFull": "AMADEO ROSSI Imp e Dist. De Artigos Esportivos Ltda",
    "dataSolicitacao": "2026-01-13",
    "dataInspecao": "2026-01-19",
    "fiscal": "",
    "pgFiscal": "",
    "tipoDoc": "LI",
    "duimpOuLi": "",
    "numDuimpLi": ""
  },
  {
    "tipo": "IMPORTAÇÃO",
    "produto": "Equipamento para visão noturna ou termal",
    "categoria": "Visão Noturna / Termal",
    "quantidade": 70,
    "moeda": "UN",
    "valor": 0.0,
    "liLpcoNum": "25/3659484-1",
    "cidade": "Joinville",
    "localDesembaraco": "Aeroporto de Joinville",
    "localFull": "Aeroporto de Joinville",
    "empresa": "Delta Cable",
    "empresaFull": "DCA DELTA CABLE AMERICAS LTDA",
    "dataSolicitacao": "2026-01-12",
    "dataInspecao": "2026-01-16",
    "fiscal": "",
    "pgFiscal": "",
    "tipoDoc": "LI",
    "duimpOuLi": "",
    "numDuimpLi": ""
  },
  {
    "tipo": "IMPORTAÇÃO",
    "produto": "Equipamento para visão noturna ou termal",
    "categoria": "Visão Noturna / Termal",
    "quantidade": 10,
    "moeda": "UN",
    "valor": 51800.0,
    "liLpcoNum": "25/4565543-2",
    "cidade": "Florianópolis",
    "localDesembaraco": "Aeroporto de Florianópolis",
    "localFull": "Aeroporto Internacional de Florianópolis, rua Hércules - Carianos, Florianópolis - SC, 88047-902",
    "empresa": "Intelbras",
    "empresaFull": "INTELBRAS S.A",
    "dataSolicitacao": "2026-01-07",
    "dataInspecao": "2026-01-15",
    "fiscal": "",
    "pgFiscal": "",
    "tipoDoc": "LI",
    "duimpOuLi": "",
    "numDuimpLi": ""
  },
  {
    "tipo": "IMPORTAÇÃO",
    "produto": "Equipamento para visão noturna ou termal",
    "categoria": "Visão Noturna / Termal",
    "quantidade": 1,
    "moeda": "UN",
    "valor": 2590.0,
    "liLpcoNum": "25/4565576-9",
    "cidade": "Florianópolis",
    "localDesembaraco": "Aeroporto de Florianópolis",
    "localFull": "Aeroporto Internacional de Florianópolis, rua Hércules - Carianos, Florianópolis - SC, 88047-902",
    "empresa": "Intelbras",
    "empresaFull": "INTELBRAS S.A",
    "dataSolicitacao": "2026-01-07",
    "dataInspecao": "2026-01-15",
    "fiscal": "",
    "pgFiscal": "",
    "tipoDoc": "LI",
    "duimpOuLi": "",
    "numDuimpLi": ""
  },
  {
    "tipo": "IMPORTAÇÃO",
    "produto": "projétil para mUNição para arma de fogo de alma raiada (ponta)",
    "categoria": "Armas de Fogo",
    "quantidade": 1050,
    "moeda": "UN",
    "valor": 322.42,
    "liLpcoNum": "25/3844451-0",
    "cidade": "Florianópolis",
    "localDesembaraco": "Aeroporto de Florianópolis",
    "localFull": "Aeroporto Internacional de Florianópolis, rua Hércules - Carianos, Florianópolis - SC, 88047-902",
    "empresa": "Pro Hunters",
    "empresaFull": "PRO HUNTERS COM. IMP E EXP LTDA",
    "dataSolicitacao": "2026-01-09",
    "dataInspecao": "2026-01-15",
    "fiscal": "",
    "pgFiscal": "",
    "tipoDoc": "LI",
    "duimpOuLi": "",
    "numDuimpLi": ""
  },
  {
    "tipo": "IMPORTAÇÃO",
    "produto": "Arma de pressão",
    "categoria": "Armas de Pressão",
    "quantidade": 1500,
    "moeda": "UN",
    "valor": 97560.36,
    "liLpcoNum": "25/4531456-2",
    "cidade": "Itajaí",
    "localDesembaraco": "Barra do Rio",
    "localFull": "BARRA DO RIO",
    "empresa": "Grupo MGL",
    "empresaFull": "GRUPO MGL COMÉRCIO INTERNACIONAL LTDA",
    "dataSolicitacao": "2026-01-06",
    "dataInspecao": "2026-01-14",
    "fiscal": "",
    "pgFiscal": "",
    "tipoDoc": "LI",
    "duimpOuLi": "",
    "numDuimpLi": ""
  },
  {
    "tipo": "IMPORTAÇÃO",
    "produto": "Trietanolamina (tri(2-hidroxietil) amina)",
    "categoria": "Trietanolamina",
    "quantidade": 18000,
    "moeda": "KG",
    "valor": 30330.0,
    "liLpcoNum": "25/3741869-9",
    "cidade": "Itajaí",
    "localDesembaraco": "Poly Terminais",
    "localFull": "Poly Terminais Portuários S.A., av. José Luiz Marcelino, 1400 - Bairro Barra do Rio, Itajaí - SC, 88305-001",
    "empresa": "Vox Comercial",
    "empresaFull": "VOX COMERCIAL IMPORTADORA E EXPORTADORA LTDA",
    "dataSolicitacao": "2026-01-09",
    "dataInspecao": "2026-01-14",
    "fiscal": "",
    "pgFiscal": "",
    "tipoDoc": "LI",
    "duimpOuLi": "",
    "numDuimpLi": ""
  },
  {
    "tipo": "IMPORTAÇÃO",
    "produto": "Trietanolamina",
    "categoria": "Trietanolamina",
    "quantidade": 18400,
    "moeda": "KG",
    "valor": 25024.0,
    "liLpcoNum": "25/3735491-7",
    "cidade": "Itajaí",
    "localDesembaraco": "Multilog",
    "localFull": "MULTILOG LOGISTICA E SERVICOS LTDA, Rod. Antônio Heil, 4999 - Itaipava, Itajaí - SC, 88316-003",
    "empresa": "Catarinense Química",
    "empresaFull": "CCQM - COMERCIAL CATARINENSE QUIMICA E METAIS LTDA",
    "dataSolicitacao": "2026-01-09",
    "dataInspecao": "2026-01-14",
    "fiscal": "",
    "pgFiscal": "",
    "tipoDoc": "LI",
    "duimpOuLi": "",
    "numDuimpLi": ""
  },
  {
    "tipo": "IMPORTAÇÃO",
    "produto": "Arma de pressão",
    "categoria": "Armas de Pressão",
    "quantidade": 47736,
    "moeda": "UN",
    "valor": 80935.52,
    "liLpcoNum": "25/3954645-7",
    "cidade": "Itajaí",
    "localDesembaraco": "Multilog",
    "localFull": "MULTILOG LOGISTICA E SERVICOS LTDA, Rod. Antônio Heil, 4999 - Itaipava, Itajaí - SC, 88316-003",
    "empresa": "AIRSOFT DO BRASIL COM. IMP. E ...",
    "empresaFull": "AIRSOFT DO BRASIL COM. IMP. E EXP S/A",
    "dataSolicitacao": "2026-01-09",
    "dataInspecao": "2026-01-14",
    "fiscal": "",
    "pgFiscal": "",
    "tipoDoc": "LI",
    "duimpOuLi": "",
    "numDuimpLi": ""
  },
  {
    "tipo": "IMPORTAÇÃO",
    "produto": "Nitrato de Potássio",
    "categoria": "Nitrato de Potássio",
    "quantidade": 24000,
    "moeda": "UN",
    "valor": 30000.0,
    "liLpcoNum": "25/3570208-0",
    "cidade": "Itapoá",
    "localDesembaraco": "Porto de Itapoá",
    "localFull": "PORTO DE ITAPOÁ",
    "empresa": "Esmalglass",
    "empresaFull": "Esmalglass do Brasil Fritas Esmaltes e Cor. Cer. LTDA",
    "dataSolicitacao": "2026-01-09",
    "dataInspecao": "2026-01-13",
    "fiscal": "",
    "pgFiscal": "",
    "tipoDoc": "LI",
    "duimpOuLi": "",
    "numDuimpLi": ""
  },
  {
    "tipo": "IMPORTAÇÃO",
    "produto": "Arma de pressão",
    "categoria": "Armas de Pressão",
    "quantidade": 4580,
    "moeda": "UN",
    "valor": 108186.5,
    "liLpcoNum": "25/3691717-9",
    "cidade": "Navegantes",
    "localDesembaraco": "Portonave",
    "localFull": "Porto Nave S/A",
    "empresa": "Amadeo Rossi",
    "empresaFull": "AMADEO ROSSI Imp e Dist. De Artigos Esportivos Ltda",
    "dataSolicitacao": "2026-01-12",
    "dataInspecao": "2026-01-13",
    "fiscal": "",
    "pgFiscal": "",
    "tipoDoc": "LI",
    "duimpOuLi": "",
    "numDuimpLi": ""
  },
  {
    "tipo": "IMPORTAÇÃO",
    "produto": "Arma de pressão",
    "categoria": "Armas de Pressão",
    "quantidade": 6300,
    "moeda": "UN",
    "valor": 0.0,
    "liLpcoNum": "25/4080250-0",
    "cidade": "Navegantes",
    "localDesembaraco": "Portonave",
    "localFull": "Porto Nave S/A",
    "empresa": "Amadeo Rossi",
    "empresaFull": "AMADEO ROSSI Imp e Dist. De Artigos Esportivos Ltda",
    "dataSolicitacao": "2026-01-12",
    "dataInspecao": "2026-01-13",
    "fiscal": "",
    "pgFiscal": "",
    "tipoDoc": "LI",
    "duimpOuLi": "",
    "numDuimpLi": ""
  },
  {
    "tipo": "IMPORTAÇÃO",
    "produto": "Arma de pressão",
    "categoria": "Armas de Pressão",
    "quantidade": 2970,
    "moeda": "UN",
    "valor": 181370.0,
    "liLpcoNum": "25/4571136-7",
    "cidade": "Navegantes",
    "localDesembaraco": "Portonave",
    "localFull": "Porto Nave S/A",
    "empresa": "Amadeo Rossi",
    "empresaFull": "AMADEO ROSSI Imp e Dist. De Artigos Esportivos Ltda",
    "dataSolicitacao": "2026-01-11",
    "dataInspecao": "2026-01-12",
    "fiscal": "",
    "pgFiscal": "",
    "tipoDoc": "LI",
    "duimpOuLi": "",
    "numDuimpLi": ""
  },
  {
    "tipo": "IMPORTAÇÃO",
    "produto": "Arma de fogo semiautomática de uso restrito",
    "categoria": "Armas de Fogo",
    "quantidade": 4,
    "moeda": "UN",
    "valor": 24444.0,
    "liLpcoNum": "25/3955552-9",
    "cidade": "Florianópolis",
    "localDesembaraco": "Aeroporto de Florianópolis",
    "localFull": "Aeroporto Internacional de Florianópolis, rua Hércules - Carianos, Florianópolis - SC, 88047-902",
    "empresa": "PMSC (Polícia Militar)",
    "empresaFull": "FUNDO DE MELHORIA DA POLÍCIA MILITAR",
    "dataSolicitacao": "2026-01-02",
    "dataInspecao": "2026-01-09",
    "fiscal": "",
    "pgFiscal": "",
    "tipoDoc": "LI",
    "duimpOuLi": "",
    "numDuimpLi": ""
  },
  {
    "tipo": "IMPORTAÇÃO",
    "produto": "Arma de fogo de repetição de uso restrito",
    "categoria": "Armas de Fogo",
    "quantidade": 6,
    "moeda": "UN",
    "valor": 63518.16,
    "liLpcoNum": "25/3954450-0",
    "cidade": "Florianópolis",
    "localDesembaraco": "Aeroporto de Florianópolis",
    "localFull": "Aeroporto Internacional de Florianópolis, rua Hércules - Carianos, Florianópolis - SC, 88047-902",
    "empresa": "PMSC (Polícia Militar)",
    "empresaFull": "FUNDO DE MELHORIA DA POLÍCIA MILITAR",
    "dataSolicitacao": "2026-01-02",
    "dataInspecao": "2026-01-09",
    "fiscal": "",
    "pgFiscal": "",
    "tipoDoc": "LI",
    "duimpOuLi": "",
    "numDuimpLi": ""
  },
  {
    "tipo": "IMPORTAÇÃO",
    "produto": "Cano de arma de fogo (sobressalente) – 16”",
    "categoria": "Armas de Fogo",
    "quantidade": 1,
    "moeda": "UN",
    "valor": 311.95,
    "liLpcoNum": "25/3954728-3",
    "cidade": "Florianópolis",
    "localDesembaraco": "Aeroporto de Florianópolis",
    "localFull": "Aeroporto Internacional de Florianópolis, rua Hércules - Carianos, Florianópolis - SC, 88047-902",
    "empresa": "PMSC (Polícia Militar)",
    "empresaFull": "FUNDO DE MELHORIA DA POLÍCIA MILITAR",
    "dataSolicitacao": "2026-01-02",
    "dataInspecao": "2026-01-09",
    "fiscal": "",
    "pgFiscal": "",
    "tipoDoc": "LI",
    "duimpOuLi": "",
    "numDuimpLi": ""
  },
  {
    "tipo": "IMPORTAÇÃO",
    "produto": "Arma de fogo automática - Submetralhadora",
    "categoria": "Armas de Fogo",
    "quantidade": 220,
    "moeda": "UN",
    "valor": 462000.0,
    "liLpcoNum": "25/3630600-5",
    "cidade": "Florianópolis",
    "localDesembaraco": "Aeroporto de Florianópolis",
    "localFull": "Aeroporto Internacional de Florianópolis, rua Hércules - Carianos, Florianópolis - SC, 88047-902",
    "empresa": "FUPESC (Fundo Penitenciário)",
    "empresaFull": "FUNDO PENITENCIARIO DO ESTADO DE SANTA CATARINA FUPESC",
    "dataSolicitacao": "2025-12-04",
    "dataInspecao": "2025-12-11",
    "fiscal": "",
    "pgFiscal": "",
    "tipoDoc": "LI",
    "duimpOuLi": "",
    "numDuimpLi": ""
  },
  {
    "tipo": "IMPORTAÇÃO",
    "produto": "Arma de fogo de repetição de uso permitido (Cal .12)",
    "categoria": "Armas de Fogo",
    "quantidade": 25,
    "moeda": "UN",
    "valor": 31894.29,
    "liLpcoNum": "26/0040148-4",
    "cidade": "Itapoá",
    "localDesembaraco": "CLIF",
    "localFull": "CLIF - CENTRO LOGISTICO INTEGRADO",
    "empresa": "Pavei Brasil",
    "empresaFull": "PAVEI BRASIL COMERCIO EXTERIOR LTDA",
    "dataSolicitacao": "2025-12-02",
    "dataInspecao": "2025-12-09",
    "fiscal": "",
    "pgFiscal": "",
    "tipoDoc": "LI",
    "duimpOuLi": "",
    "numDuimpLi": ""
  },
  {
    "tipo": "IMPORTAÇÃO",
    "produto": "Arma de fogo semi-automática de uso permitido (Pistola)",
    "categoria": "Armas de Fogo",
    "quantidade": 300,
    "moeda": "UN",
    "valor": 120078.57,
    "liLpcoNum": "26/0041519-1",
    "cidade": "Itapoá",
    "localDesembaraco": "CLIF",
    "localFull": "CLIF - CENTRO LOGISTICO INTEGRADO",
    "empresa": "Pavei Brasil",
    "empresaFull": "PAVEI BRASIL COMERCIO EXTERIOR LTDA",
    "dataSolicitacao": "2025-12-02",
    "dataInspecao": "2025-12-09",
    "fiscal": "",
    "pgFiscal": "",
    "tipoDoc": "LI",
    "duimpOuLi": "",
    "numDuimpLi": ""
  },
  {
    "tipo": "IMPORTAÇÃO",
    "produto": "Arma de fogo de repetição de uso permitido (Cal .12)",
    "categoria": "Armas de Fogo",
    "quantidade": 25,
    "moeda": "UN",
    "valor": 31894.29,
    "liLpcoNum": "26/0041232-0",
    "cidade": "Itapoá",
    "localDesembaraco": "CLIF",
    "localFull": "CLIF - CENTRO LOGISTICO INTEGRADO",
    "empresa": "Pavei Brasil",
    "empresaFull": "PAVEI BRASIL COMERCIO EXTERIOR LTDA",
    "dataSolicitacao": "2025-12-02",
    "dataInspecao": "2025-12-09",
    "fiscal": "",
    "pgFiscal": "",
    "tipoDoc": "LI",
    "duimpOuLi": "",
    "numDuimpLi": ""
  }
];

// ── Active data (after filters) ──────────────────────────────
let activeData = [...RAW_DATA];
let chartInstances = {};

// ── Chart.js Global Config ───────────────────────────────────
Chart.defaults.color = '#8b949e';
Chart.defaults.borderColor = 'rgba(48, 54, 61, 0.5)';
Chart.defaults.font.family = "'Inter', sans-serif";
Chart.defaults.font.size = 12;
Chart.defaults.plugins.legend.labels.usePointStyle = true;
Chart.defaults.plugins.legend.labels.padding = 16;
Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(13, 17, 23, 0.95)';
Chart.defaults.plugins.tooltip.titleColor = '#e6edf3';
Chart.defaults.plugins.tooltip.bodyColor = '#8b949e';
Chart.defaults.plugins.tooltip.borderColor = 'rgba(74, 124, 89, 0.3)';
Chart.defaults.plugins.tooltip.borderWidth = 1;
Chart.defaults.plugins.tooltip.cornerRadius = 8;
Chart.defaults.plugins.tooltip.padding = 12;

// ── Utility Functions ────────────────────────────────────────

function formatUSD(value) {
  return '$' + value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function formatUSDCompact(value) {
  if (value >= 1000000) {
    return '$' + (value / 1000000).toFixed(2) + 'M';
  } else if (value >= 1000) {
    return '$' + (value / 1000).toFixed(1) + 'K';
  }
  return '$' + value.toFixed(2);
}

function daysBetween(dateStr1, dateStr2) {
  const d1 = new Date(dateStr1);
  const d2 = new Date(dateStr2);
  const diffTime = Math.abs(d2 - d1);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function formatDateBR(dateStr) {
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const [y, m, d] = parts;
    return `${d}/${m}/${y}`;
  }
  return dateStr;
}

function getMonthKey(dateStr) {
  if (!dateStr) return 'Sem Data';
  return dateStr.substring(0, 7); // "YYYY-MM"
}

function formatMonthKey(monthKey) {
  if (monthKey === 'Sem Data') return monthKey;
  const parts = monthKey.split('-');
  if (parts.length === 2) {
    const [y, m] = parts;
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const idx = parseInt(m) - 1;
    if (idx >= 0 && idx < 12) {
      return months[idx] + '/' + y;
    }
  }
  return monthKey;
}

function groupBy(arr, keyFn) {
  const map = {};
  arr.forEach(item => {
    const key = keyFn(item);
    if (!map[key]) map[key] = [];
    map[key].push(item);
  });
  return map;
}

function sumByKey(arr, key) {
  return arr.reduce((sum, item) => sum + (item[key] || 0), 0);
}

// ── Color Palette ────────────────────────────────────────────
const COLORS = {
  olive: '#4a7c59',
  oliveLight: '#5e9e6e',
  navy: '#2c5f8a',
  navyLight: '#3d7bad',
  green: '#7ed957',
  blue: '#58a6ff',
  amber: '#f0a830',
  purple: '#a78bfa',
  pink: '#f472b6',
  teal: '#2dd4bf',
  chart: [
    'rgba(74, 124, 89, 0.85)',
    'rgba(44, 95, 138, 0.85)',
    'rgba(126, 217, 87, 0.85)',
    'rgba(88, 166, 255, 0.85)',
    'rgba(240, 168, 48, 0.85)',
    'rgba(167, 139, 250, 0.85)',
    'rgba(244, 114, 182, 0.85)',
    'rgba(45, 212, 191, 0.85)'
  ],
  chartBorder: [
    'rgba(74, 124, 89, 1)',
    'rgba(44, 95, 138, 1)',
    'rgba(126, 217, 87, 1)',
    'rgba(88, 166, 255, 1)',
    'rgba(240, 168, 48, 1)',
    'rgba(167, 139, 250, 1)',
    'rgba(244, 114, 182, 1)',
    'rgba(45, 212, 191, 1)'
  ]
};

// ── KPI Calculations ─────────────────────────────────────────

function calculateKPIs(data) {
  const totalValue = sumByKey(data, 'valor');
  const totalProcesses = data.length;
  const liCount = data.filter(d => d.tipoDoc === 'LI').length;
  const lpcoCount = data.filter(d => d.tipoDoc === 'LPCO').length;

  let slaTotal = 0;
  let slaCount = 0;
  data.forEach(d => {
    if (d.dataSolicitacao && d.dataInspecao) {
      slaTotal += daysBetween(d.dataSolicitacao, d.dataInspecao);
      slaCount++;
    }
  });
  const slaAvg = slaCount > 0 ? (slaTotal / slaCount) : 0;

  return { totalValue, totalProcesses, liCount, lpcoCount, slaAvg };
}

// ── Animated Counter ─────────────────────────────────────────

function animateValue(element, start, end, duration, formatter) {
  let startTime = null;
  const step = (timestamp) => {
    if (!startTime) startTime = timestamp;
    const progress = Math.min((timestamp - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
    const current = start + (end - start) * eased;
    element.textContent = formatter ? formatter(current) : Math.round(current).toString();
    if (progress < 1) {
      requestAnimationFrame(step);
    }
  };
  requestAnimationFrame(step);
}

// ── Render KPIs ──────────────────────────────────────────────

function renderKPIs(data) {
  const kpis = calculateKPIs(data);

  const elValue = document.getElementById('kpi-total-value');
  const elProcesses = document.getElementById('kpi-total-processes');
  const elLI = document.getElementById('kpi-li-count');
  const elLPCO = document.getElementById('kpi-lpco-count');
  const elSLA = document.getElementById('kpi-sla');
  const elSLABadge = document.getElementById('kpi-sla-badge');

  animateValue(elValue, 0, kpis.totalValue, 2500, formatUSD);
  animateValue(elProcesses, 0, kpis.totalProcesses, 2500, v => Math.round(v).toString());
  animateValue(elLI, 0, kpis.liCount, 2500, v => Math.round(v).toString());
  animateValue(elLPCO, 0, kpis.lpcoCount, 2500, v => Math.round(v).toString());
  animateValue(elSLA, 0, kpis.slaAvg, 2500, v => v.toFixed(1) + ' dias');

  // SLA badge
  if (elSLABadge) {
    elSLABadge.className = 'sla-badge';
    if (kpis.slaAvg <= 7) {
      elSLABadge.classList.add('sla-good');
      elSLABadge.innerHTML = '● Dentro do SLA';
    } else if (kpis.slaAvg <= 15) {
      elSLABadge.classList.add('sla-warning');
      elSLABadge.innerHTML = '● Atenção';
    } else {
      elSLABadge.classList.add('sla-critical');
      elSLABadge.innerHTML = '● Acima do SLA';
    }
  }
}

// ── Chart: Values by Month ───────────────────────────────────

function renderValuesChart(data) {
  const ctx = document.getElementById('chart-values-month');
  if (!ctx) return;

  if (chartInstances.valuesMonth) chartInstances.valuesMonth.destroy();

  const grouped = groupBy(data, d => getMonthKey(d.dataInspecao));
  const sortedMonths = Object.keys(grouped).sort();
  const labels = sortedMonths.map(formatMonthKey);
  const values = sortedMonths.map(month => sumByKey(grouped[month], 'valor'));

  chartInstances.valuesMonth = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Valor Desembaraçado (US$)',
        data: values,
        backgroundColor: 'rgba(74, 124, 89, 0.7)',
        borderColor: 'rgba(94, 158, 110, 1)',
        borderWidth: 1,
        borderRadius: 6,
        borderSkipped: false,
        hoverBackgroundColor: 'rgba(126, 217, 87, 0.8)',
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => ' ' + formatUSD(ctx.parsed.y)
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { size: 11 } }
        },
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(48, 54, 61, 0.3)' },
          ticks: {
            callback: v => formatUSDCompact(v),
            font: { size: 11 }
          }
        }
      }
    }
  });
}

// ── Chart: Volume by Month ───────────────────────────────────

function renderVolumeChart(data) {
  const ctx = document.getElementById('chart-volume-time');
  if (!ctx) return;

  if (chartInstances.volumeTime) chartInstances.volumeTime.destroy();

  const grouped = groupBy(data, d => getMonthKey(d.dataInspecao));
  const sortedMonths = Object.keys(grouped).sort();
  const labels = sortedMonths.map(formatMonthKey);
  const counts = sortedMonths.map(month => grouped[month].length);

  chartInstances.volumeTime = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Vistorias Realizadas',
        data: counts,
        borderColor: COLORS.blue,
        backgroundColor: 'rgba(88, 166, 255, 0.1)',
        borderWidth: 2.5,
        pointBackgroundColor: COLORS.blue,
        pointBorderColor: '#0d1117',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
        tension: 0.3,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => ` ${ctx.parsed.y} inspeç${ctx.parsed.y === 1 ? 'ão' : 'ões'}`
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { size: 11 } }
        },
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(48, 54, 61, 0.3)' },
          ticks: {
            stepSize: 1,
            font: { size: 11 }
          }
        }
      }
    }
  });
}

// ── Chart: Cities (Doughnut) ─────────────────────────────────

function renderCitiesChart(data) {
  const ctx = document.getElementById('chart-cities');
  if (!ctx) return;

  if (chartInstances.cities) chartInstances.cities.destroy();

  const grouped = groupBy(data, d => d.cidade);
  const labels = Object.keys(grouped);
  const counts = labels.map(city => grouped[city].length);

  chartInstances.cities = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data: counts,
        backgroundColor: [COLORS.chart[0], COLORS.chart[1], COLORS.chart[2], COLORS.chart[3]],
        borderColor: [COLORS.chartBorder[0], COLORS.chartBorder[1], COLORS.chartBorder[2], COLORS.chartBorder[3]],
        borderWidth: 2,
        hoverOffset: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '65%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 20,
            font: { size: 12, weight: '500' }
          }
        },
        tooltip: {
          callbacks: {
            label: ctx => {
              const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
              const pct = ((ctx.parsed / total) * 100).toFixed(1);
              return ` ${ctx.label}: ${ctx.parsed} vistorias (${pct}%)`;
            }
          }
        }
      }
    },
    plugins: [{
      id: 'centerText',
      beforeDraw(chart) {
        const { width, height, ctx: context } = chart;
        const total = chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
        context.save();
        context.font = "bold 28px 'Inter', sans-serif";
        context.fillStyle = '#e6edf3';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        const centerY = (chart.chartArea.top + chart.chartArea.bottom) / 2;
        context.fillText(total, width / 2, centerY - 8);
        context.font = "11px 'Inter', sans-serif";
        context.fillStyle = '#8b949e';
        context.fillText('TOTAL', width / 2, centerY + 14);
        context.restore();
      }
    }]
  });
}

// ── Chart: Locations (Horizontal Bar) ────────────────────────

function renderLocationsChart(data) {
  const ctx = document.getElementById('chart-locations');
  if (!ctx) return;

  if (chartInstances.locations) chartInstances.locations.destroy();

  const grouped = groupBy(data, d => d.localDesembaraco);
  const entries = Object.entries(grouped)
    .map(([name, items]) => ({ name, count: items.length }))
    .sort((a, b) => b.count - a.count);

  chartInstances.locations = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: entries.map(e => e.name),
      datasets: [{
        label: 'Vistorias',
        data: entries.map(e => e.count),
        backgroundColor: entries.map((_, i) => COLORS.chart[i % COLORS.chart.length]),
        borderColor: entries.map((_, i) => COLORS.chartBorder[i % COLORS.chartBorder.length]),
        borderWidth: 1,
        borderRadius: 6,
        borderSkipped: false,
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => ` ${ctx.parsed.x} vistorias`
          }
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          grid: { color: 'rgba(48, 54, 61, 0.3)' },
          ticks: { stepSize: 1, font: { size: 11 } }
        },
        y: {
          grid: { display: false },
          ticks: { font: { size: 11 } }
        }
      }
    }
  });
}

// ── Chart: Products ──────────────────────────────────────────

function renderProductsChart(data) {
  const ctx = document.getElementById('chart-products');
  if (!ctx) return;

  if (chartInstances.products) chartInstances.products.destroy();

  const grouped = groupBy(data, d => d.categoria);
  const entries = Object.entries(grouped)
    .map(([name, items]) => ({
      name,
      quantidade: sumByKey(items, 'quantidade'),
      valor: sumByKey(items, 'valor')
    }))
    .sort((a, b) => b.valor - a.valor);

  chartInstances.products = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: entries.map(e => e.name),
      datasets: [
        {
          label: 'Valor (US$)',
          data: entries.map(e => e.valor),
          backgroundColor: 'rgba(74, 124, 89, 0.75)',
          borderColor: 'rgba(94, 158, 110, 1)',
          borderWidth: 1,
          borderRadius: 6,
          borderSkipped: false,
          yAxisID: 'y'
        },
        {
          label: 'Quantidade (un)',
          data: entries.map(e => e.quantidade),
          backgroundColor: 'rgba(88, 166, 255, 0.75)',
          borderColor: 'rgba(88, 166, 255, 1)',
          borderWidth: 1,
          borderRadius: 6,
          borderSkipped: false,
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: { font: { size: 11 } }
        },
        tooltip: {
          callbacks: {
            label: ctx => {
              if (ctx.datasetIndex === 0) return ' ' + formatUSD(ctx.parsed.y);
              return ` ${ctx.parsed.y.toLocaleString('en-US')} unidades`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            font: { size: 10 },
            maxRotation: 25
          }
        },
        y: {
          type: 'linear',
          position: 'left',
          beginAtZero: true,
          grid: { color: 'rgba(48, 54, 61, 0.3)' },
          ticks: {
            callback: v => formatUSDCompact(v),
            font: { size: 11 }
          },
          title: {
            display: true,
            text: 'Valor (US$)',
            color: '#5e9e6e',
            font: { size: 11 }
          }
        },
        y1: {
          type: 'linear',
          position: 'right',
          beginAtZero: true,
          grid: { drawOnChartArea: false },
          ticks: {
            font: { size: 11 }
          },
          title: {
            display: true,
            text: 'Quantidade',
            color: '#58a6ff',
            font: { size: 11 }
          }
        }
      }
    }
  });
}

// ── Companies Table ──────────────────────────────────────────

function renderCompaniesTable(data) {
  const tbody = document.getElementById('companies-table-body');
  if (!tbody) return;

  const grouped = groupBy(data, d => d.empresa);
  const entries = Object.entries(grouped)
    .map(([name, items]) => ({
      name,
      fullName: items[0].empresaFull,
      valor: sumByKey(items, 'valor'),
      processos: items.length
    }))
    .sort((a, b) => b.valor - a.valor);

  const maxValor = entries.length > 0 ? entries[0].valor : 1;

  tbody.innerHTML = entries.map((e, i) => {
    const rankClass = i === 0 ? 'rank-1' : i === 1 ? 'rank-2' : i === 2 ? 'rank-3' : 'rank-default';
    const pct = ((e.valor / maxValor) * 100).toFixed(1);
    return `
      <tr>
        <td><span class="rank-badge ${rankClass}">${i + 1}</span></td>
        <td>
          <div class="company-name" title="${e.fullName}">${e.name}</div>
          <div class="company-processes">${e.processos} processo${e.processos > 1 ? 's' : ''}</div>
        </td>
        <td>
          <div class="progress-bar-container">
            <div class="progress-bar-fill" style="width: ${pct}%"></div>
          </div>
        </td>
        <td>${formatUSD(e.valor)}</td>
      </tr>
    `;
  }).join('');
}

// ── Filters ──────────────────────────────────────────────────

function populateFilters(data) {
  const cities = [...new Set(data.map(d => d.cidade))].sort();
  const locations = [...new Set(data.map(d => d.localDesembaraco))].sort();
  const companies = [...new Set(data.map(d => d.empresa))].sort();
  const fiscais = [...new Set(data.map(d => d.fiscal))].sort();

  fillSelect('filter-city', cities);
  fillSelect('filter-location', locations);
  fillSelect('filter-company', companies);
  fillSelect('filter-fiscal', fiscais);

  // The date fields now stay empty (saying "Todos") by default.
}

function fillSelect(id, options) {
  const select = document.getElementById(id);
  if (!select) return;
  const currentVal = select.value;
  select.innerHTML = '<option value="">Todos</option>';
  options.forEach(opt => {
    const el = document.createElement('option');
    el.value = opt;
    el.textContent = opt;
    select.appendChild(el);
  });
  if (currentVal) select.value = currentVal;
}

function applyFilters() {
  const dateStart = document.getElementById('filter-date-start').value;
  const dateEnd = document.getElementById('filter-date-end').value;
  const city = document.getElementById('filter-city').value;
  const location = document.getElementById('filter-location').value;
  const company = document.getElementById('filter-company').value;
  const fiscal = document.getElementById('filter-fiscal').value;

  activeData = RAW_DATA.filter(d => {
    if (dateStart && d.dataInspecao < dateStart) return false;
    if (dateEnd && d.dataInspecao > dateEnd) return false;
    if (city && d.cidade !== city) return false;
    if (location && d.localDesembaraco !== location) return false;
    if (company && d.empresa !== company) return false;
    if (fiscal && d.fiscal !== fiscal) return false;
    return true;
  });

  renderAll(activeData);
}

function clearFilters() {
  document.getElementById('filter-city').value = '';
  document.getElementById('filter-location').value = '';
  document.getElementById('filter-company').value = '';
  document.getElementById('filter-fiscal').value = '';

  const dates = RAW_DATA.map(d => d.dataInspecao).filter(Boolean).sort();
  const solDates = RAW_DATA.map(d => d.dataSolicitacao).filter(Boolean).sort();
  const allDates = [...dates, ...solDates].sort();
  if (allDates.length > 0) {
    document.getElementById('filter-date-start').value = allDates[0];
    document.getElementById('filter-date-end').value = allDates[allDates.length - 1];
  }

  activeData = [...RAW_DATA];
  renderAll(activeData);
}

// ── Sanitization and Cleaning Functions ──────────────────────

function sanitizeCity(name) {
  if (!name) return 'Sem Cidade';
  const val = name.trim().replace(/\s+/g, ' ');
  const lower = val.toLowerCase();
  if (lower.includes('multilog')) return 'Itajaí';
  if (lower.includes('itajai') || lower.includes('itajaí')) return 'Itajaí';
  if (lower.includes('florianopolis') || lower.includes('florianópolis')) return 'Florianópolis';
  if (lower.includes('itapoa') || lower.includes('itapoá')) return 'Itapoá';
  if (lower.includes('joinville')) return 'Joinville';
  if (lower.includes('blumenau')) return 'Blumenau';
  if (lower.includes('navegantes')) return 'Navegantes';
  return val;
}

function sanitizeLocation(name) {
  if (!name) return 'Sem Recinto';
  const val = name.trim().replace(/\s+/g, ' ');
  const lower = val.toLowerCase();
  if (lower.includes('multilog')) return 'Multilog';
  if (lower.includes('localfrio')) return 'CLIA - Localfrio';
  if (lower.includes('poly')) return 'Poly Terminais';
  if (lower.includes('aeroporto') && lower.includes('florian')) return 'Aeroporto de Florianópolis';
  if (lower.includes('aeroporto') && lower.includes('joinville')) return 'Aeroporto de Joinville';
  if (lower.includes('aeroporto')) return 'Aeroporto';
  if (lower.includes('clif')) return 'CLIF';
  if (lower.includes('navegantes') || lower.includes('portonave') || lower.includes('porto nave')) return 'Portonave';
  if (lower.includes('itapoa') || lower.includes('itapoá')) return 'Porto de Itapoá';
  if (lower.includes('empresa') || lower.includes('importador')) return 'Recinto Próprio';
  if (lower.includes('barra do rio')) return 'Barra do Rio';
  return val.length > 40 ? val.substring(0, 40) + '...' : val;
}

function sanitizeCompany(name) {
  if (!name) return 'Sem Empresa';
  const val = name.trim().replace(/\s+/g, ' ');
  const lower = val.toLowerCase();
  if (lower.includes('rossi')) return 'Amadeo Rossi';
  if (lower.includes('btg pactual')) return 'BTG Pactual';
  if (lower.includes('intelbras')) return 'Intelbras';
  if (lower.includes('fixxar')) return 'Fixxar';
  if (lower.includes('aguas azuis') || lower.includes('águas azuis')) return 'Águas Azuis';
  if (lower.includes('grupo mgl')) return 'Grupo MGL';
  if (lower.includes('link comercial')) return 'Link Comercial';
  if (lower.includes('ascensus')) return 'Ascensus Trading';
  if (lower.includes('capital trade')) return 'Capital Trade';
  if (lower.includes('comercial catarinense') || lower.includes('ccqm')) return 'Catarinense Química';
  if (lower.includes('delta cable') || lower.includes('dca')) return 'Delta Cable';
  if (lower.includes('dmt import')) return 'DMT Importadora';
  if (lower.includes('esmalglass')) return 'Esmalglass';
  if (lower.includes('komport')) return 'Komport';
  if (lower.includes('pavei')) return 'Pavei Brasil';
  if (lower.includes('pro hunters')) return 'Pro Hunters';
  if (lower.includes('r & t') || lower.includes('r&t')) return 'R&T Comércio';
  if (lower.includes('srv')) return 'SRV Comércio';
  if (lower.includes('swbr')) return 'SWBR';
  if (lower.includes('trathoimport')) return 'Trathoimport';
  if (lower.includes('unividros')) return 'Unividros';
  if (lower.includes('vox comercial')) return 'Vox Comercial';
  if (lower.includes('policia civil') || lower.includes('fumpc')) return 'PCSC (Polícia Civil)';
  if (lower.includes('policia militar') || lower.includes('polícia militar')) return 'PMSC (Polícia Militar)';
  if (lower.includes('penitenciario') || lower.includes('fupesc')) return 'FUPESC (Fundo Penitenciário)';
  if (lower.includes('seguranca publica') || lower.includes('segurança pública')) return 'SSP/SC (Secretaria de Segurança)';
  if (lower.includes('sorocaba')) return 'Município de Sorocaba';
  return val.length > 30 ? val.substring(0, 30) + '...' : val;
}

function sanitizeProduct(name) {
  if (!name) return 'Sem Produto';
  const val = name.trim().replace(/\s+/g, ' ');
  const lower = val.toLowerCase();
  if (lower.includes('tecido bal') || lower.includes('escudo bal')) return 'Tecido/Escudo Balístico';
  if (lower.includes('arma') && lower.includes('press')) return 'Armas de Pressão';
  if (lower.includes('arma de fogo') || lower.includes('metralhadora') || lower.includes('pistola') || lower.includes('carabina') || lower.includes('submetralhadora') || lower.includes('cal .12') || lower.includes('fuzil')) {
    if (lower.includes('pesado') || lower.includes('12,7mm') || lower.includes('.50')) return 'Armamento Pesado';
    return 'Armas de Fogo';
  }
  if (lower.includes('simulacro') || lower.includes('replica') || lower.includes('réplica')) return 'Simulacro / Réplica';
  if (lower.includes('visao termal') || lower.includes('visão termal') || lower.includes('noturna') || lower.includes('zenmuse')) return 'Visão Noturna / Termal';
  if (lower.includes('radar') || lower.includes('radiodetec')) return 'Radar de Controle de Tiro';
  if (lower.includes('muni') || lower.includes('proj')) return 'Munições e Projéteis';
  if (lower.includes('espoleta')) return 'Espoletas';
  if (lower.includes('nitrato de pot')) return 'Nitrato de Potássio';
  if (lower.includes('trietanolamina')) return 'Trietanolamina';
  if (lower.includes('missel') || lower.includes('míssil') || lower.includes('misseis')) return 'Sistemas de Mísseis';
  if (lower.includes('cano de arma') || lower.includes('sobressalente')) return 'Partes e Componentes';
  return val.length > 40 ? val.substring(0, 40) + '...' : val;
}

// ── CSV Parser and Loader ────────────────────────────────────

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function parseBRValue(str) {
  if (!str) return 0;
  str = str.replace(/"/g, '').trim();
  if (str.includes(',')) {
    str = str.replace(/\./g, '').replace(',', '.');
  }
  const val = parseFloat(str);
  return isNaN(val) ? 0 : val;
}

function parseDateBR(str) {
  if (!str) return '';
  str = str.trim();
  const parts = str.split('/');
  if (parts.length === 3) {
    const [d, m, y] = parts;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  return str;
}

function loadCSVFile(file) {
  const reader = new FileReader();
  reader.onload = function (e) {
    const text = e.target.result;
    const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
    const dataLines = lines.slice(2);
    const newData = [];

    dataLines.forEach(line => {
      const cols = parseCSVLine(line);
      if (cols.length < 14) return;

      newData.push({
        tipo: cols[0] || '',
        produto: cols[1] || '',
        categoria: sanitizeProduct(cols[1] || ''),
        quantidade: parseInt(cols[2]) || 0,
        moeda: cols[3] || '',
        valor: parseBRValue(cols[4]),
        liLpcoNum: cols[5] || '',
        cidade: sanitizeCity(cols[6] || ''),
        localDesembaraco: sanitizeLocation(cols[7] || ''),
        localFull: cols[7] || '',
        empresa: sanitizeCompany(cols[8] || ''),
        empresaFull: cols[8] || '',
        dataSolicitacao: parseDateBR(cols[9]),
        dataInspecao: parseDateBR(cols[10]),
        fiscal: cols[11] || '',
        pgFiscal: cols[12] || '',
        tipoDoc: cols[13] || '',
        duimpOuLi: cols[14] || '',
        numDuimpLi: cols[15] || ''
      });
    });

    if (newData.length > 0) {
      try {
        localStorage.setItem('comexData', JSON.stringify(newData));
        localStorage.setItem('comexTimestamp', new Date().toISOString());
      } catch (err) {
        console.warn('Could not save to localStorage', err);
      }
      RAW_DATA.length = 0;
      newData.forEach(d => RAW_DATA.push(d));
      activeData = [...RAW_DATA];
      populateFilters(RAW_DATA);
      renderAll(activeData);
      updateTimestamp();
    } else {
      alert('Nenhum dado válido encontrado no CSV.');
    }
  };
  reader.readAsText(file, 'UTF-8');
}

function updateTimestamp() {
  const el = document.getElementById('last-update');
  if (el) {
    let now = new Date();
    const savedTs = localStorage.getItem('comexTimestamp');
    if (savedTs) {
      now = new Date(savedTs);
    }
    el.textContent = now.toLocaleDateString('pt-BR') + ' ' + now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }
}

// ── KPI Details Interactivity ────────────────────────────────

let currentDetailFilter = null;

function showDetails(filterType, forceUpdate = false) {
  const panel = document.getElementById('kpi-details-panel');
  const title = document.getElementById('details-panel-title');
  const tbody = document.getElementById('details-table-body');
  
  if (!panel || !title || !tbody) return;

  // Toggle behavior
  if (!forceUpdate && currentDetailFilter === filterType && panel.classList.contains('show')) {
    closeDetails();
    return;
  }

  currentDetailFilter = filterType;
  let filtered = [];
  let displayTitle = '';

  switch (filterType) {
    case 'value':
      filtered = [...activeData];
      displayTitle = 'Detalhamento: Todos os Processos (Por Valor)';
      break;
    case 'processes':
      filtered = [...activeData];
      displayTitle = 'Detalhamento: Todos os Processos Finalizados';
      break;
    case 'li':
      filtered = activeData.filter(d => d.tipoDoc === 'LI');
      displayTitle = 'Detalhamento: Licenças de Importação (LI)';
      break;
    case 'lpco':
      filtered = activeData.filter(d => d.tipoDoc === 'LPCO');
      displayTitle = 'Detalhamento: Processos LPCO / DUIMP';
      break;
    default:
      closeDetails();
      return;
  }

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="10" style="text-align: center; color: var(--text-muted); padding: var(--space-md);">Nenhum processo encontrado para este filtro.</td></tr>`;
  } else {
    tbody.innerHTML = filtered.map(d => {
      return `
        <tr>
          <td><strong>${d.numDuimpLi || d.liLpcoNum || '-'}</strong></td>
          <td><span class="sla-badge" style="background: rgba(88, 166, 255, 0.1); color: var(--accent-blue); padding: 2px 6px; margin: 0;">${d.tipoDoc}</span></td>
          <td title="${d.produto}">${d.categoria}</td>
          <td>${d.quantidade.toLocaleString('en-US')}</td>
          <td title="${d.empresaFull}">${d.empresa}</td>
          <td>${d.cidade}</td>
          <td title="${d.localFull}">${d.localDesembaraco}</td>
          <td>${d.fiscal}</td>
          <td>${formatDateBR(d.dataInspecao)}</td>
          <td>${formatUSD(d.valor)}</td>
        </tr>
      `;
    }).join('');
  }

  title.textContent = `${displayTitle} (${filtered.length})`;
  panel.classList.add('show');
  
  // Smooth scroll to details panel
  setTimeout(() => {
    panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, 100);
}

function updateDetailsIfOpen() {
  if (currentDetailFilter) {
    showDetails(currentDetailFilter, true);
  }
}

function closeDetails() {
  const panel = document.getElementById('kpi-details-panel');
  if (panel) {
    panel.classList.remove('show');
    currentDetailFilter = null;
  }
}

// ── Render All ───────────────────────────────────────────────

function renderAll(data) {
  renderKPIs(data);
  renderValuesChart(data);
  renderVolumeChart(data);
  renderCitiesChart(data);
  renderLocationsChart(data);
  renderProductsChart(data);
  renderCompaniesTable(data);
  updateDetailsIfOpen();
}

// ── Initialization ───────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  // Try to load from localStorage
  const savedData = localStorage.getItem('comexData');
  if (savedData) {
    try {
      const parsed = JSON.parse(savedData);
      if (parsed && parsed.length > 0) {
        RAW_DATA.length = 0;
        parsed.forEach(d => RAW_DATA.push(d));
      }
    } catch (e) {
      console.error('Error parsing saved comexData', e);
    }
  }

  // Populate filters
  populateFilters(RAW_DATA);

  // Initial render
  renderAll(RAW_DATA);
  updateTimestamp();

  // Hide loading overlay
  setTimeout(() => {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.classList.add('hidden');
  }, 800);

  // Filter event listeners
  document.getElementById('filter-date-start').addEventListener('change', applyFilters);
  document.getElementById('filter-date-end').addEventListener('change', applyFilters);
  document.getElementById('filter-city').addEventListener('change', applyFilters);
  document.getElementById('filter-location').addEventListener('change', applyFilters);
  document.getElementById('filter-company').addEventListener('change', applyFilters);
  document.getElementById('filter-fiscal').addEventListener('change', applyFilters);
  document.getElementById('btn-clear-filters').addEventListener('click', () => {
    clearFilters();
    closeDetails();
  });

  // KPI cards details handlers
  document.querySelector('.kpi-value-card').addEventListener('click', () => showDetails('value'));
  document.querySelector('.kpi-process-card').addEventListener('click', () => showDetails('processes'));
  document.querySelector('.kpi-li-card').addEventListener('click', () => showDetails('li'));
  document.querySelector('.kpi-lpco-card').addEventListener('click', () => showDetails('lpco'));

  // Close details handler
  const btnClose = document.getElementById('btn-close-details');
  if (btnClose) {
    btnClose.addEventListener('click', closeDetails);
  }

  // CSV loader
  const btnLoad = document.getElementById('btn-load-csv');
  const csvInput = document.getElementById('csv-file-input');
  if (btnLoad && csvInput) {
    btnLoad.addEventListener('click', () => csvInput.click());
    csvInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        loadCSVFile(e.target.files[0]);
        closeDetails();
      }
    });
  }
});
