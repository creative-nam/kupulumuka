import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { stableId } from "../scripts/lib/deterministic-id";
import { validateUserContact } from "../lib/db/user-validation";

type ProvinciaSeed = {
  name: string;
  distritos: {
    name: string;
    bairros: {
      name: string;
      quarteiroes: string[];
      shelters: {
        name: string;
        tier: "OFFICIAL" | "COMMUNITY";
        capacityStatus: "AVAILABLE" | "NEARLY_FULL" | "FULL";
        routeDescription: string;
        uploadedByEmail?: string;
      }[];
      vizinhos: string[];
    }[];
  }[];
};

const data: ProvinciaSeed[] = [
  {
    name: "Cidade de Maputo",
    distritos: [
      {
        name: "Distrito Municipal Kampfumo",
        bairros: [
          {
            name: "Central",
            quarteiroes: ["Quarteirão A", "Quarteirão B"],
            shelters: [
              {
                name: "Escola Primária Central",
                tier: "OFFICIAL",
                capacityStatus: "AVAILABLE",
                routeDescription: "Av. 25 de Setembro, em frente ao Mercado Central. Entrada pelo portão principal.",
              },
            ],
            vizinhos: ["Alto Maé"],
          },
          {
            name: "Alto Maé",
            quarteiroes: ["Quarteirão 1", "Quarteirão 2"],
            shelters: [
              {
                name: "Centro de Saúde Alto Maé",
                tier: "OFFICIAL",
                capacityStatus: "NEARLY_FULL",
                routeDescription: "Rua da Resistência, ao lado do Mercado do Alto Maé. Porta verde.",
              },
            ],
            vizinhos: ["Central", "Polana Cimento"],
          },
          {
            name: "Polana Cimento",
            quarteiroes: ["Quarteirão Central"],
            shelters: [
              {
                name: "Igreja São Francisco",
                tier: "OFFICIAL",
                capacityStatus: "FULL",
                routeDescription: "Av. Kwame Nkrumah, próximo ao Hospital Central. Portão azul à direita.",
              },
            ],
            vizinhos: ["Alto Maé"],
          },
          {
            name: "Coop",
            quarteiroes: ["Quarteirão Cooperativo"],
            shelters: [
              {
                name: "Associação Comunitária Coop",
                tier: "COMMUNITY",
                capacityStatus: "AVAILABLE",
                routeDescription: "Rua das Flores, nº 45. Sala no primeiro andar.",
              },
            ],
            vizinhos: ["Malhangalene"],
          },
          {
            name: "Malhangalene",
            quarteiroes: ["Quarteirão Malhangalene"],
            shelters: [
              {
                name: "Escola Secundária Malhangalene",
                tier: "OFFICIAL",
                capacityStatus: "AVAILABLE",
                routeDescription: "Av. da Marginal, após o semáforo do Hotel Polana. Entrada lateral.",
              },
            ],
            vizinhos: ["Coop"],
          },
        ],
      },
    ],
  },
  {
    name: "Província de Maputo",
    distritos: [
      {
        name: "Matola",
        bairros: [
          {
            name: "Khongolote",
            quarteiroes: ["Quarteirão 12", "Quarteirão 14", "Quarteirão 7"],
            shelters: [
              {
                name: "EPC Khongolote",
                tier: "OFFICIAL",
                capacityStatus: "AVAILABLE",
                routeDescription: "Av. da Liberdade, perto do campo de futebol. Portão principal aberto.",
              },
              {
                name: "Igreja Católica",
                tier: "OFFICIAL",
                capacityStatus: "NEARLY_FULL",
                routeDescription: "Rua da Igreja, ao lado do mercado do Khongolote. Campanário visível.",
              },
              {
                name: "Salão Paroquial S. João",
                tier: "COMMUNITY",
                capacityStatus: "AVAILABLE",
                routeDescription: "Rua de São João, nº 123, após a curva do mercado. Portão branco.",
                uploadedByEmail: "carlos@example.com",
              },
            ],
            vizinhos: ["T-3"],
          },
          {
            name: "T-3",
            quarteiroes: ["Quarteirão T-3 A", "Quarteirão T-3 B"],
            shelters: [
              {
                name: "Centro Polivalente T-3",
                tier: "OFFICIAL",
                capacityStatus: "AVAILABLE",
                routeDescription: "Av. Moçambique, rotunda do T-3, edifício amarelo.",
              },
            ],
            vizinhos: ["Khongolote", "Matola Gare"],
          },
          {
            name: "Matola Gare",
            quarteiroes: ["Quarteirão Estação"],
            shelters: [
              {
                name: "Armazém da Gare",
                tier: "COMMUNITY",
                capacityStatus: "FULL",
                routeDescription: "Rua da Estação, antigo armazém ao lado da linha férrea.",
              },
            ],
            vizinhos: ["T-3"],
          },
          {
            name: "Fomento",
            quarteiroes: ["Quarteirão Fomento Centro"],
            shelters: [
              {
                name: "Escola Primária do Fomento",
                tier: "OFFICIAL",
                capacityStatus: "NEARLY_FULL",
                routeDescription: "Rua do Comércio, bairro do Fomento, ao lado da padaria.",
              },
            ],
            vizinhos: ["Tsalala"],
          },
          {
            name: "Tsalala",
            quarteiroes: ["Quarteirão Tsalala Sul"],
            shelters: [
              {
                name: "Mesquita de Tsalala",
                tier: "COMMUNITY",
                capacityStatus: "AVAILABLE",
                routeDescription: "Rua Principal de Tsalala, edifício branco com minarete.",
              },
            ],
            vizinhos: ["Fomento"],
          },
        ],
      },
      {
        name: "Boane",
        bairros: [
          {
            name: "Boane Sede",
            quarteiroes: ["Quarteirão Central", "Quarteirão Novo"],
            shelters: [
              {
                name: "Administração de Boane",
                tier: "OFFICIAL",
                capacityStatus: "AVAILABLE",
                routeDescription: "Av. da Administração, edifício sede do município. Salão nobre no piso térreo.",
              },
              {
                name: "Igreja Evangélica de Boane",
                tier: "COMMUNITY",
                capacityStatus: "NEARLY_FULL",
                routeDescription: "Rua da Igreja, a 200m do mercado municipal. Cruz azul na fachada.",
              },
            ],
            vizinhos: ["Beluluane"],
          },
          {
            name: "Beluluane",
            quarteiroes: ["Quarteirão Beluluane"],
            shelters: [
              {
                name: "Escola Primária de Beluluane",
                tier: "OFFICIAL",
                capacityStatus: "FULL",
                routeDescription: "Estrada Nacional EN4, km 15, ao lado da ponte. Portão vermelho.",
              },
            ],
            vizinhos: ["Boane Sede"],
          },
        ],
      },
    ],
  },
  {
    name: "Sofala",
    distritos: [
      {
        name: "Beira",
        bairros: [
          {
            name: "Ponta-Gêa",
            quarteiroes: ["Quarteirão Praia", "Quarteirão Centro"],
            shelters: [
              {
                name: "Escola Secundária da Ponta-Gêa",
                tier: "OFFICIAL",
                capacityStatus: "AVAILABLE",
                routeDescription: "Av. Marginal, perto do farol. Edifício de três pisos.",
              },
            ],
            vizinhos: ["Matacuane"],
          },
          {
            name: "Matacuane",
            quarteiroes: ["Quarteirão Matacuane A"],
            shelters: [
              {
                name: "Centro de Saúde Matacuane",
                tier: "OFFICIAL",
                capacityStatus: "NEARLY_FULL",
                routeDescription: "Rua do Centro de Saúde, atrás do mercado. Placa azul na entrada.",
              },
            ],
            vizinhos: ["Ponta-Gêa", "Macuti"],
          },
          {
            name: "Macuti",
            quarteiroes: ["Quarteirão Macuti Praia"],
            shelters: [
              {
                name: "Igreja de Macuti",
                tier: "COMMUNITY",
                capacityStatus: "AVAILABLE",
                routeDescription: "Av. do Aeroporto, ao lado do cemitério de Macuti. Portão grande de ferro.",
              },
            ],
            vizinhos: ["Matacuane"],
          },
          {
            name: "Estoril",
            quarteiroes: ["Quarteirão Estoril Sul"],
            shelters: [
              {
                name: "Polidesportivo do Estoril",
                tier: "OFFICIAL",
                capacityStatus: "FULL",
                routeDescription: "Rua do Estoril, campo coberto ao lado da escola.",
              },
            ],
            vizinhos: ["Munhava"],
          },
          {
            name: "Munhava",
            quarteiroes: ["Quarteirão Munhava Alto"],
            shelters: [
              {
                name: "Escola Primária de Munhava",
                tier: "OFFICIAL",
                capacityStatus: "AVAILABLE",
                routeDescription: "Av. Principal de Munhava, subida após o mercado informal.",
              },
            ],
            vizinhos: ["Estoril"],
          },
        ],
      },
    ],
  },
  {
    name: "Gaza",
    distritos: [
      {
        name: "Chókwè",
        bairros: [
          {
            name: "Chókwè Sede",
            quarteiroes: ["Quarteirão Central", "Quarteirão Aeroporto"],
            shelters: [
              {
                name: "Escola Secundária de Chókwè",
                tier: "OFFICIAL",
                capacityStatus: "AVAILABLE",
                routeDescription: "Av. da Independência, ao lado do Hospital Rural. Portão principal.",
              },
            ],
            vizinhos: ["Lionde"],
          },
          {
            name: "Lionde",
            quarteiroes: ["Quarteirão Lionde A"],
            shelters: [
              {
                name: "Centro Comunitário de Lionde",
                tier: "COMMUNITY",
                capacityStatus: "NEARLY_FULL",
                routeDescription: "Rua de Lionde, a 500m da EN1. Edifício pintado de verde.",
              },
            ],
            vizinhos: ["Chókwè Sede", "Macarretane"],
          },
          {
            name: "Macarretane",
            quarteiroes: ["Quarteirão Macarretane"],
            shelters: [
              {
                name: "Igreja de Macarretane",
                tier: "COMMUNITY",
                capacityStatus: "AVAILABLE",
                routeDescription: "Estrada para o regadio, ao lado da ponte sobre o Rio Limpopo.",
              },
            ],
            vizinhos: ["Lionde"],
          },
          {
            name: "Xilembene",
            quarteiroes: ["Quarteirão Xilembene Alto"],
            shelters: [
              {
                name: "Escola Primária de Xilembene",
                tier: "OFFICIAL",
                capacityStatus: "FULL",
                routeDescription: "Rua Principal de Xilembene, ao lado da loja do Sr. António.",
              },
            ],
            vizinhos: ["Conhane"],
          },
          {
            name: "Conhane",
            quarteiroes: ["Quarteirão Conhane Baixo"],
            shelters: [
              {
                name: "Associação de Agricultores de Conhane",
                tier: "COMMUNITY",
                capacityStatus: "AVAILABLE",
                routeDescription: "Estrada do Chókwè ao Xai-Xai, km 8. Armazém com telhado vermelho.",
              },
            ],
            vizinhos: ["Xilembene"],
          },
        ],
      },
    ],
  },
];

export async function runSeed(prisma: PrismaClient) {
  console.log("Starting seed...");

  // Wipe geographic data in dependency order so the seed is idempotent.
  // Users are upserted and preserved across runs.
  await prisma.shelter.deleteMany();
  await prisma.user.updateMany({ data: { homeQuarteiraoId: null } });
  await prisma.bairroVizinho.deleteMany();
  await prisma.quarteirao.deleteMany();
  await prisma.bairro.deleteMany();
  await prisma.distrito.deleteMany();
  await prisma.provincia.deleteMany();

  await createUsers(prisma);

  for (const provincia of data) {
    const createdProvincia = await prisma.provincia.create({
      data: {
        id: stableId("provincia", provincia.name),
        name: provincia.name,
      },
    });
    console.log(`Provincia: ${createdProvincia.name}`);

    for (const distrito of provincia.distritos) {
      const createdDistrito = await prisma.distrito.create({
        data: {
          id: stableId("distrito", provincia.name, distrito.name),
          name: distrito.name,
          provinciaId: createdProvincia.id,
        },
      });
      console.log(`  Distrito: ${createdDistrito.name}`);

      // Phase 1: Create all bairros (and their quarteiroes/shelters), collect IDs
      const bairroInfos: {
        id: string;
        name: string;
        vizinhos: string[];
      }[] = [];

      for (const bairro of distrito.bairros) {
        const createdBairro = await prisma.bairro.create({
          data: {
            id: stableId("bairro", provincia.name, distrito.name, bairro.name),
            name: bairro.name,
            distritoId: createdDistrito.id,
          },
        });
        console.log(`    Bairro: ${createdBairro.name}`);

        const quarteiraoMap = new Map<string, string>();

        for (const qName of bairro.quarteiroes) {
          const createdQ = await prisma.quarteirao.create({
            data: {
              id: stableId(
                "quarteirao",
                provincia.name,
                distrito.name,
                bairro.name,
                qName,
              ),
              name: qName,
              bairroId: createdBairro.id,
            },
          });
          quarteiraoMap.set(qName, createdQ.id);
        }

        const defaultQuarteiraoId = quarteiraoMap.values().next().value!;

        for (const shelterData of bairro.shelters) {
          let uploadedById: string | undefined;

          if (shelterData.uploadedByEmail) {
            const user = await prisma.user.findUnique({
              where: { email: shelterData.uploadedByEmail },
            });
            if (user) uploadedById = user.id;
          }

          await prisma.shelter.create({
            data: {
              id: stableId(
                "shelter",
                provincia.name,
                distrito.name,
                bairro.name,
                shelterData.name,
              ),
              name: shelterData.name,
              tier: shelterData.tier,
              capacityStatus: shelterData.capacityStatus,
              routeDescription: shelterData.routeDescription,
              quarteiraoId: defaultQuarteiraoId,
              uploadedById: uploadedById ?? null,
            },
          });
        }

        bairroInfos.push({
          id: createdBairro.id,
          name: bairro.name,
          vizinhos: bairro.vizinhos,
        });
      }

      // Phase 2: Create all BairroVizinho pairs (all bairros now exist)
      const bairroIdByName = new Map(bairroInfos.map((b) => [b.name, b.id]));

      const pairs: { bairroAId: string; bairroBId: string }[] = [];

      for (const bairroInfo of bairroInfos) {
        for (const vizinhoName of bairroInfo.vizinhos) {
          const vizinhoId = bairroIdByName.get(vizinhoName);
          if (!vizinhoId) {
            throw new Error(
              `Vizinho "${vizinhoName}" (referenced by "${bairroInfo.name}" in distrito "${distrito.name}") not found — cross-distrito neighbours are not supported because bairroIdByName is scoped to the current distrito`,
            );
          }
          pairs.push({ bairroAId: bairroInfo.id, bairroBId: vizinhoId });
        }
      }

      if (pairs.length > 0) {
        await prisma.bairroVizinho.createMany({ data: pairs, skipDuplicates: true });
      }
    }
  }

  console.log("\nSeed completed successfully!");
  console.log(`Provincias: ${await prisma.provincia.count()}`);
  console.log(`Distritos: ${await prisma.distrito.count()}`);
  console.log(`Bairros: ${await prisma.bairro.count()}`);
  console.log(`Quarteiroes: ${await prisma.quarteirao.count()}`);
  console.log(`Shelters: ${await prisma.shelter.count()}`);
  console.log(`BairroVizinhos: ${await prisma.bairroVizinho.count()}`);
  console.log(`Users: ${await prisma.user.count()}`);
}

async function createUsers(prisma: PrismaClient) {
  const institutionalUsers = [
    {
      name: "Maria João",
      email: "maria@cm-maputo.gov.mz",
      role: "ADMIN" as const,
      verificationStatus: "VERIFIED" as const,
      phone: null,
    },
    {
      name: "António Langa",
      email: "antonio@matola.gov.mz",
      role: "ADMIN" as const,
      verificationStatus: "VERIFIED" as const,
      phone: null,
    },
    {
      name: "Helena Muchanga",
      email: "helena@beira.gov.mz",
      role: "ADMIN" as const,
      verificationStatus: "VERIFIED" as const,
      phone: null,
    },
    {
      name: "João Chambisse",
      email: "joao@chokwe.gov.mz",
      role: "ADMIN" as const,
      verificationStatus: "VERIFIED" as const,
      phone: null,
    },
  ];

  for (const user of institutionalUsers) {
    validateUserContact(user);
    await prisma.user.upsert({
      where: { email: user.email! },
      update: {},
      create: {
        name: user.name,
        email: user.email,
        role: user.role,
        verificationStatus: user.verificationStatus,
        phone: user.phone,
      },
    });
  }

  const communityUsers = [
    {
      name: "Carlos Tembe",
      email: "carlos@example.com",
      phone: "+258840000001",
      role: "CITIZEN" as const,
      verificationStatus: "UNVERIFIED" as const,
    },
    {
      name: "Anastácia Mabunda",
      email: null,
      phone: "+258840000002",
      role: "CITIZEN" as const,
      verificationStatus: "UNVERIFIED" as const,
    },
    {
      name: "Filipe Nhadumbué",
      email: null,
      phone: "+258840000003",
      role: "CITIZEN" as const,
      verificationStatus: "UNVERIFIED" as const,
    },
    {
      name: "Rosa Guambe",
      email: null,
      phone: "+258840000004",
      role: "CITIZEN" as const,
      verificationStatus: "UNVERIFIED" as const,
    },
  ];

  for (const user of communityUsers) {
    validateUserContact(user);
    await prisma.user.upsert({
      where: { phone: user.phone! },
      update: {},
      create: {
        name: user.name,
        phone: user.phone,
        role: user.role,
        verificationStatus: user.verificationStatus,
        email: user.email,
      },
    });
  }
}

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env["DIRECT_URL"] });
  const prisma = new PrismaClient({ adapter });
  await runSeed(prisma);
  await prisma.$disconnect();
}

if (process.argv[1]?.replace(/\\/g, "/").endsWith("prisma/seed.ts")) {
  main()
    .then(() => {
      process.exit(0);
    })
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
