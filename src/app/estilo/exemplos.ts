import type { Cargo, Origem } from "@/lib/dominio";

/**
 * Os exemplos de `Cargos`, `Faq` e `AtosPublicados` na vitrine.
 *
 * ## Por que existe um arquivo de exemplo, e não uma chamada
 *
 * A vitrine é uma página do app e não pode falar com a API nem com o banco —
 * e, mesmo que pudesse, não deveria: `obterDetalhe` sem `BC_API_URL` devolve
 * `cargos: []` e `origens: []`, porque o mock é um acervo de resumos e não
 * tem ato nem cargo. Sem isto aqui, os três componentes não aparecem em lugar
 * nenhum do app quando se desenha contra o mock, que é o modo padrão.
 *
 * ## O dado é real, copiado do acervo e congelado
 *
 * Nada aqui foi inventado. Cada ato e cada cargo saiu de
 * `GET /concurso/{slug}` do engine em 2026-09-14, verbatim, com o texto
 * inteiro e as posições que o motor gravou. É a mesma regra de
 * `TITULO_MAIS_LONGO`, na página: escrito aqui em vez de lido na hora, para a
 * vitrine mostrar o caso real mesmo rodando contra o mock.
 *
 * Congelar é o que mantém o exemplo honesto. `RespostaDoFaq.inicioChar` e
 * `fimChar` são deslocamentos dentro de `Origem.texto`; mexer num caractere
 * do texto move o grifo para outra frase, e o exemplo passaria a mentir sobre
 * o componente. **Se alguém editar o texto de um ato daqui, as posições têm
 * de sair junto** — ou, melhor, copie outro ato inteiro do acervo.
 *
 * Os nomes próprios que aparecem (o reitor que assina, a banca contratada)
 * saíram publicados no Diário Oficial da União, que é onde estes atos moram.
 * Cargo com nome de candidato na evidência foi deixado de fora de propósito:
 * o acervo tem, e uma vitrine de design system não precisa.
 */

/**
 * O ato que responde — CRA-AM, edital nº 1/2026, 1.481 caracteres.
 *
 * Escolhido por um detalhe que nenhum teste de Node mostra: **três das quatro
 * respostas saem da mesma frase**, na mesma posição (660) ou dentro dela. É o
 * caso que `lib/destaque.ts` descreve — "as inscrições serão realizadas … no
 * endereço eletrônico X" responde ao mesmo tempo "até quando", "onde" e
 * "como" —, e no navegador ele tem de virar **uma** marca amarela com **três**
 * `id` dentro, e não três marcas aninhadas com o texto repetido. Os três links
 * do FAQ caem todos nessa marca.
 *
 * Traz de brinde as outras duas coisas do bloco: o endereço dentro do trecho,
 * que vira link (`www.institutoconsulplan.org.br`), e duas perguntas que o ato
 * não responde, que viram a linha única do fim.
 */
export const ATO_QUE_RESPONDE: Origem = {
  "chave": "51136917",
  "url": "https://pesquisa.in.gov.br/imprensa/jsp/visualiza/index.jsp?data=04/09/2026&jornal=530&pagina=134",
  "titulo": "EDITAL Nº 1/2026",
  "fonte": "Diário Oficial da União",
  "vistoEm": "2026-09-12T02:35:56.426195Z",
  "texto": "EDITAL Nº 1/2026 CONCURSO PÚBLICO para provimento de vagas e formação de cadastro de reserva, para cargos de nível médio e nível superior, do quadro de pessoal do CRA-AM O Presidente do Conselho Regional de Administração do Amazonas - CRA-AM, no uso das suas atribuições legais, de acordo com a legislação pertinente e com as normas constantes no Edital e em seus anexos, torna pública a realização de CONCURSO PÚBLICO para provimento de vagas e formação de cadastro de reserva, para cargos de nível médio e nível superior, do quadro de pessoal do CRA-AM. O concurso público será realizado sob a responsabilidade técnica e operacional do Instituto Consulplan. As inscrições serão realizadas exclusivamente por meio da internet no endereço eletrônico <www.institutoconsulplan.org.br>, a partir das 16h00min do dia 16 de setembro de 2026 até às 16h00min do dia 15 de outubro de 2026 (horário de Manaus/AM). A realização das Provas Objetiva e Discursiva está prevista para a data 22 de novembro de 2026, em dois turnos, em local a ser divulgado, na cidade de Manaus. Os candidatos contratados estarão subordinados ao Decreto-Lei Federal nº 5.452/1943 (Consolidação das Leis do Trabalho) e aos demais dispositivos legais aplicáveis. O edital, contendo todas as normas e os requisitos para participação no concurso público, estará disponível nos endereços eletrônicos: www.craam.org.br e www.institutoconsulplan.org.br Manaus, 2 de setembro de 2026. JOSÉ CARLOS DE SÁ COLARES Presidente",
  "caracteres": 1481,
  "faq": [
    {
      "pergunta": "quem_pode",
      "situacao": "nao_respondida",
      "trecho": null,
      "inicioChar": null,
      "fimChar": null,
      "motivoDescarte": null
    },
    {
      "pergunta": "ate_quando",
      "situacao": "respondida",
      "trecho": "As inscrições serão realizadas exclusivamente por meio da internet no endereço eletrônico <www.institutoconsulplan.org.br>, a partir das 16h00min do dia 16 de setembro de 2026 até às 16h00min do dia 15 de outubro de 2026 (horário de Manaus/AM).",
      "inicioChar": 660,
      "fimChar": 904,
      "motivoDescarte": null
    },
    {
      "pergunta": "quanto_custa",
      "situacao": "nao_respondida",
      "trecho": null,
      "inicioChar": null,
      "fimChar": null,
      "motivoDescarte": null
    },
    {
      "pergunta": "onde_inscrever",
      "situacao": "respondida",
      "trecho": "As inscrições serão realizadas exclusivamente por meio da internet no endereço eletrônico <www.institutoconsulplan.org.br>",
      "inicioChar": 660,
      "fimChar": 782,
      "motivoDescarte": null
    },
    {
      "pergunta": "como_inscrever",
      "situacao": "respondida",
      "trecho": "As inscrições serão realizadas exclusivamente por meio da internet no endereço eletrônico <www.institutoconsulplan.org.br>",
      "inicioChar": 660,
      "fimChar": 782,
      "motivoDescarte": null
    },
    {
      "pergunta": "etapas_prova",
      "situacao": "respondida",
      "trecho": "A realização das Provas Objetiva e Discursiva está prevista para a data 22 de novembro de 2026, em dois turnos, em local a ser divulgado, na cidade de Manaus.",
      "inicioChar": 905,
      "fimChar": 1063,
      "motivoDescarte": null
    }
  ],
  "editalCitadoUrl": "https://www.institutoconsulplan.org.br"
};

/**
 * O ato com descarte, e o único que se parte em parágrafos — edital nº
 * 110/2026, 1.867 caracteres.
 *
 * Duas coisas, e as duas só se veem no navegador:
 *
 * 1. **O descarte.** É raro no acervo (53 de 5.346 respostas, 1,0% em
 *    2026-09-14) e é o único sinal que aponta defeito nosso em vez de lacuna
 *    do documento: o modelo devolveu um trecho para "onde se inscrever" e o
 *    motor não o achou no texto, palavra por palavra. Sem um exemplo aqui, a
 *    linha que diz isso não aparece em tela nenhuma.
 * 2. **A partição em parágrafos.** O texto do Diário chega sem uma quebra de
 *    linha sequer, e `lib/leitura.ts` acha onde a estrutura abre. Este ato tem
 *    os marcadores (`2.`, `3.`, `4.`…) e vira **seis** parágrafos; os outros
 *    dois exemplos não têm marcador nenhum e saem como um só, que também é um
 *    resultado correto e é a metade da regra que se costuma esquecer.
 *
 *    E é o que prova que a partição não move o grifo: as posições do FAQ são
 *    deslocamentos no texto inteiro, cada parágrafo desconta o seu `inicio`
 *    antes de pintar, e aqui as três respostas caem nos parágrafos 0, 2 e 5.
 *    Se a conta estivesse errada, o amarelo apareceria na frase vizinha —
 *    visível de longe, e invisível para a suíte.
 */
export const ATO_COM_DESCARTE: Origem = {
  "chave": "49582522",
  "url": "https://pesquisa.in.gov.br/imprensa/jsp/visualiza/index.jsp?data=01/06/2026&jornal=530&pagina=38",
  "titulo": "EDITAL N° 110, DE 29 DE MAIO DE 2026",
  "fonte": "Diário Oficial da União",
  "vistoEm": "2026-09-12T03:57:21.253131Z",
  "texto": "EDITAL N° 110, DE 29 DE MAIO DE 2026 PROCESSO SELETIVO SIMPLIFICADO O Diretor Geral do Campus Londrina do Instituto Federal do Paraná, no uso da competência que lhe confere a Portaria nº 230, de 09 de fevereiro de 2024, publicada no Diário Oficial da União em 14 de fevereiro de 2024, seção 02, página 23, e conforme Resolução Consup/IFPR nº 107 de 16/12/2022, torna público que estarão abertas as inscrições no período de 01/06/2026 a 16/06/2026, para formação de cadastro de reserva (CR), no Instituto Federal do Paraná - IFPR, Campus Londrina, área: Saúde Bucal, nos termos da Lei 8.745/93, alterações dadas pela Lei 9.849/99 e Lei 12.425/11, conforme abaixo especificado: 1 A inscrição será efetuada apenas via internet para a Gestão de Pessoas do Campus Londrina, por meio de requerimento, das 08h00 do dia 01/06/2026 e término às 18h00 do dia 16/06/2026, conforme item 2 do Edital 110/2026; 2. A isenção da taxa de inscrição deverá ser solicitada conforme orientações constantes nos itens 2.4, 2.4.1 e 2.4.2 do Edital N. 110/2026, no período de 01 de junho de 2026 a 02 de junho de 2026; 3. O pagamento da taxa de inscrição no valor de R$ 67,17 (sessenta e sete reais e dezessete centavos) deverá ser efetuado conforme orientações constantes no subitem 2.3.4 do edital; 4. O processo seletivo simplificado terá validade de 1 (um) ano, a partir da publicação do Edital de Homologação no Diário Oficial da União; 5. O Edital completo e instruções específicas com os programas e estruturas das provas estarão disponíveis no site https://reitoria.ifpr.edu.br/trabalhe-no-ifpr/processo-seletivo-simplificado/professor-substituto/ e no site https://astorga.ifpr.edu.br/index.php/menu-principal/concursos-e-processos-seletivos/ do campus; 6. A prova didática e a prova de títulos serão realizadas conforme itens 5 e 6 do Edital N. 110/2026. REINALDO BENEDITO NISHIKAWA",
  "caracteres": 1867,
  "faq": [
    {
      "pergunta": "quem_pode",
      "situacao": "nao_respondida",
      "trecho": null,
      "inicioChar": null,
      "fimChar": null,
      "motivoDescarte": null
    },
    {
      "pergunta": "ate_quando",
      "situacao": "respondida",
      "trecho": "1 A inscrição será efetuada apenas via internet para a Gestão de Pessoas do Campus Londrina, por meio de requerimento, das 08h00 do dia 01/06/2026 e término às 18h00 do dia 16/06/2026, conforme item 2 do Edital 110/2026;",
      "inicioChar": 676,
      "fimChar": 896,
      "motivoDescarte": null
    },
    {
      "pergunta": "quanto_custa",
      "situacao": "respondida",
      "trecho": "3. O pagamento da taxa de inscrição no valor de R$ 67,17 (sessenta e sete reais e dezessete centavos) deverá ser efetuado conforme orientações constantes no subitem 2.3.4 do edital;",
      "inicioChar": 1094,
      "fimChar": 1275,
      "motivoDescarte": null
    },
    {
      "pergunta": "onde_inscrever",
      "situacao": "descartada",
      "trecho": null,
      "inicioChar": null,
      "fimChar": null,
      "motivoDescarte": "sem_ancora"
    },
    {
      "pergunta": "como_inscrever",
      "situacao": "respondida",
      "trecho": "1 A inscrição será efetuada apenas via internet para a Gestão de Pessoas do Campus Londrina, por meio de requerimento, das 08h00 do dia 01/06/2026 e término às 18h00 do dia 16/06/2026, conforme item 2 do Edital 110/2026;",
      "inicioChar": 676,
      "fimChar": 896,
      "motivoDescarte": null
    },
    {
      "pergunta": "etapas_prova",
      "situacao": "respondida",
      "trecho": "6. A prova didática e a prova de títulos serão realizadas conforme itens 5 e 6 do Edital N. 110/2026.",
      "inicioChar": 1738,
      "fimChar": 1839,
      "motivoDescarte": null
    }
  ],
  "editalCitadoUrl": "https://reitoria.ifpr.edu.br/trabalhe-no-ifpr/processo-seletivo-simplificado/professor-substituto/"
};

/**
 * O ato que não responde nenhuma — IFB Ceilândia, edital nº 11/2026, 639
 * caracteres.
 *
 * Duas coisas de uma vez, e as duas são estados que quebram:
 *
 * 1. **Nenhuma das seis perguntas foi respondida.** `cabecalhoDoFaq` inverte o
 *    título ("O que este ato **não** responde") e larga a linha de apoio sobre
 *    o trecho literal, porque não há trecho. São 90 concursos no acervo, e o
 *    bloco inteiro vira uma frase.
 * 2. **`url` é nulo.** O endereço público do ato não foi registrado, e
 *    `AtosPublicados` troca o link por texto e explica que o ato está guardado
 *    inteiro logo abaixo. É o estado de todo o acervo hoje, e mesmo assim era
 *    o que não se via em lugar nenhum.
 */
export const ATO_QUE_NAO_RESPONDE: Origem = {
  "chave": "49294220",
  "url": null,
  "titulo": "Edital nº 11/2026 - DGCE/RIFB/IFBRASILIA",
  "fonte": "Diário Oficial da União",
  "vistoEm": "2026-09-12T03:55:49.149304Z",
  "texto": "Edital nº 11/2026 - DGCE/RIFB/IFBRASILIA O DIRETOR-GERAL DO CAMPUS CEILANDIA DO INSTITUTO FEDERAL DE EDUCACAO, CIENCIA E TECNOLOGIA DE BRASILIA, no uso de suas atribuicoes legais, torna publico o Processo Seletivo Simplificado para contratacao de Professor Substituto, na area de Licenciatura em Letras Espanhol, para atuacao no Campus Ceilandia, sob regime de trabalho de 40 horas semanais. E ofertada 01 vaga, com contrato inicial de 6 meses, podendo ser prorrogado, a criterio da Administracao. O edital completo encontra-se disponível no endereco eletrônico www.ifb.edu.br. Paulo Henrique Sales Wanderley Diretor-Geral Campus Ceilandia",
  "caracteres": 639,
  "faq": [
    {
      "pergunta": "quem_pode",
      "situacao": "nao_respondida",
      "trecho": null,
      "inicioChar": null,
      "fimChar": null,
      "motivoDescarte": null
    },
    {
      "pergunta": "ate_quando",
      "situacao": "nao_respondida",
      "trecho": null,
      "inicioChar": null,
      "fimChar": null,
      "motivoDescarte": null
    },
    {
      "pergunta": "quanto_custa",
      "situacao": "nao_respondida",
      "trecho": null,
      "inicioChar": null,
      "fimChar": null,
      "motivoDescarte": null
    },
    {
      "pergunta": "onde_inscrever",
      "situacao": "nao_respondida",
      "trecho": null,
      "inicioChar": null,
      "fimChar": null,
      "motivoDescarte": null
    },
    {
      "pergunta": "como_inscrever",
      "situacao": "nao_respondida",
      "trecho": null,
      "inicioChar": null,
      "fimChar": null,
      "motivoDescarte": null
    },
    {
      "pergunta": "etapas_prova",
      "situacao": "nao_respondida",
      "trecho": null,
      "inicioChar": null,
      "fimChar": null,
      "motivoDescarte": null
    }
  ],
  "editalCitadoUrl": "https://www.ifb.edu.br"
};

/**
 * Seis cargos do acervo, um por ramo que `Cargos` tem de aguentar. A ordem é
 * a do mais completo ao mais vazio, que é a ordem em que a degradação se lê:
 *
 * 1. **UTFPR** — tudo preenchido, com taxa de inscrição (a etiqueta que só
 *    251 cargos em 700 concursos produzem) e remuneração em faixa.
 * 2. **UFRPE** — o mesmo, com `codigo` ao lado do nome e um requisito de
 *    cinco formações, que é o que faz a lista de requisitos quebrar linha.
 * 3. **UFMT** — vaga e requisito, **sem remuneração**: o campo diz "não
 *    informada no ato" em vez de sumir. É a maioria do acervo, e é o estado
 *    que a docstring do componente chama de comum.
 * 4. **UFBA** — uma vaga com `ampla: 0` e `pcd: 1`. É o defeito que já
 *    aconteceu: a repartição só aparecia com duas ou mais categorias, e esta
 *    vaga saía como "Salvador: 1 vaga", escondendo que a única vaga é
 *    reservada. Aqui ela tem de sair como "Salvador: 1 vaga (PCD: 1)".
 * 5. **PROGESP** — `total: 0` com `cadastroReserva`, que não é "nenhuma
 *    vaga": tem de sair "sem vaga imediata (cadastro reserva)".
 * 6. **COREN-PI** — nome e nada mais. Sem escolaridade, sem área, sem vaga,
 *    sem remuneração e sem evidência: o `<details>` do "de onde isto foi
 *    lido" não existe, e as duas linhas de `<dl>` dizem o que falta.
 */
export const CARGOS_DE_PROVA: Cargo[] = [
  {
    "nome": "Professor do Magistério Federal Substituto",
    "codigo": null,
    "escolaridade": "pos_graduacao",
    "area": "Biodiversidade e Ciências Agrárias/Bioquímica",
    "jornadaHoras": 40,
    "requisitos": [
      {
        "descricao": "Pós-Graduação",
        "formacoes": []
      }
    ],
    "taxaInscricao": 99,
    "vagas": [
      {
        "localidade": "Dois Vizinhos",
        "uf": null,
        "ampla": 2,
        "pcd": 0,
        "negros": 0,
        "outras": 0,
        "total": 2,
        "cadastroReserva": false,
        "crQuantidade": null
      }
    ],
    "remuneracoes": [
      {
        "base": 4478.03,
        "total": 5149.74,
        "tipo": "mensal",
        "observacao": null
      }
    ],
    "evidencia": [
      {
        "campo": "requisitos",
        "trecho": "item 1.2"
      },
      {
        "campo": "remuneracao_base",
        "trecho": "item 1.4"
      }
    ]
  },
  {
    "nome": "Administração Financeira/ Ciências Contábeis",
    "codigo": "12",
    "escolaridade": "superior",
    "area": "Unidade Acadêmica de Serra Talhada (UAST)",
    "jornadaHoras": 40,
    "requisitos": [
      {
        "descricao": "Bacharelado em Administração ou Ciências Contábeis e Doutorado em Administração ou Ciências Contábeis ou Controladoria",
        "formacoes": [
          "Administração",
          "Ciências Contábeis",
          "Doutorado em Administração",
          "Doutorado em Ciências Contábeis",
          "Doutorado em Controladoria"
        ]
      }
    ],
    "taxaInscricao": null,
    "vagas": [
      {
        "localidade": "Serra Talhada",
        "uf": null,
        "ampla": 1,
        "pcd": 0,
        "negros": 0,
        "outras": 0,
        "total": 1,
        "cadastroReserva": false,
        "crQuantidade": null
      }
    ],
    "remuneracoes": [
      {
        "base": 6180.86,
        "total": 13288.85,
        "tipo": "mensal",
        "observacao": null
      }
    ],
    "evidencia": [
      {
        "campo": "vagas",
        "trecho": "item 6.1.1, quadro de vagas, nº 12"
      },
      {
        "campo": "requisitos",
        "trecho": "item 6.1.1, quadro de vagas, coluna Perfil do Candidato, nº 12"
      },
      {
        "campo": "remuneracao_base",
        "trecho": "item 4.1 - tabela de remuneração, Classe A, Nível 1"
      }
    ]
  },
  {
    "nome": "Professor Substituto",
    "codigo": null,
    "escolaridade": "superior",
    "area": "Antropologia/Sociologia/Filosofia e áreas afins",
    "jornadaHoras": 40,
    "requisitos": [
      {
        "descricao": "Graduação, ou especialização, ou mestrado, ou doutorado em Antropologia, Sociologia, Filosofia, História, Ciências Sociais, Teologia e áreas afins",
        "formacoes": [
          "Antropologia",
          "Sociologia",
          "Filosofia",
          "História",
          "Ciências Sociais",
          "Teologia",
          "áreas afins"
        ]
      }
    ],
    "taxaInscricao": null,
    "vagas": [
      {
        "localidade": "Sinop",
        "uf": null,
        "ampla": 1,
        "pcd": 0,
        "negros": 0,
        "outras": 0,
        "total": 1,
        "cadastroReserva": false,
        "crQuantidade": null
      }
    ],
    "remuneracoes": [],
    "evidencia": [
      {
        "campo": "vagas",
        "trecho": "01 (uma) vaga"
      },
      {
        "campo": "requisitos",
        "trecho": "Requisito básico: Graduação, ou especialização, ou mestrado, ou doutorado em Antropologia, Sociologia, Filosofia, História, Ciências Sociais, Teologia e áreas afins"
      },
      {
        "campo": "remuneracao",
        "trecho": "Remuneração (VB+RT): Graduação: R$ 4.326,60 / Especialização: R$ 4.975,59 / Mestrado: R$ 5.949,07 / Doutorado: R$ 8.058,29"
      },
      {
        "campo": "jornada_horas",
        "trecho": "Regime de Trabalho: 40 (quarenta) horas semanais"
      }
    ]
  },
  {
    "nome": "Professor do Magistério Superior",
    "codigo": null,
    "escolaridade": null,
    "area": "Lavra Subterrânea",
    "jornadaHoras": null,
    "requisitos": [],
    "taxaInscricao": null,
    "vagas": [
      {
        "localidade": "Salvador",
        "uf": null,
        "ampla": 0,
        "pcd": 1,
        "negros": 0,
        "outras": 0,
        "total": 1,
        "cadastroReserva": false,
        "crQuantidade": null
      }
    ],
    "remuneracoes": [],
    "evidencia": [
      {
        "campo": "area",
        "trecho": "Área de Conhecimento: Lavra Subterrânea"
      },
      {
        "campo": "vagas",
        "trecho": "Vagas: 1, ocupada por pessoa com deficiência, conforme Decreto nº 9.508/2018 e Edital 07/2025"
      },
      {
        "campo": "regime",
        "trecho": "Regime de Trabalho: Dedicação Exclusiva"
      }
    ]
  },
  {
    "nome": "Professor Substituto/Temporário",
    "codigo": null,
    "escolaridade": "superior",
    "area": "Processamento Digital de Sinais, Sinais e Sistemas e Sistemas Digitais",
    "jornadaHoras": 20,
    "requisitos": [
      {
        "descricao": "Pós-Graduação Stricto Sensu (Mestrado ou Doutorado) em Engenharia Biomédica ou Engenharia Elétrica ou Engenharia da Computação ou Ciências da Computação ou Neuroengenharia ou Neurociências ou Bioinformática",
        "formacoes": [
          "Engenharia Biomédica",
          "Engenharia Elétrica",
          "Engenharia da Computação",
          "Ciências da Computação",
          "Neuroengenharia",
          "Neurociências",
          "Bioinformática"
        ]
      }
    ],
    "taxaInscricao": null,
    "vagas": [
      {
        "localidade": "Natal",
        "uf": null,
        "ampla": 0,
        "pcd": 0,
        "negros": 0,
        "outras": 0,
        "total": 0,
        "cadastroReserva": true,
        "crQuantidade": null
      }
    ],
    "remuneracoes": [],
    "evidencia": [
      {
        "campo": "vagas",
        "trecho": "Coluna VAGAS: CR"
      },
      {
        "campo": "requisitos",
        "trecho": "LEIA-SE, item 2.1, tabela, Departamento de Engenharia Biomédica - Campus de Natal/RN"
      }
    ]
  },
  {
    "nome": "Contador(a)",
    "codigo": null,
    "escolaridade": null,
    "area": null,
    "jornadaHoras": null,
    "requisitos": [],
    "taxaInscricao": null,
    "vagas": [],
    "remuneracoes": [],
    "evidencia": []
  }
];