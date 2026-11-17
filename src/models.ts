// Gerado por sdks/contract/generate.py a partir de sdks/contract/openapi.json. Não edite.

/** Página de resultados das rotas de listagem. */
export interface Page<T> {
  page: number;
  pageSize: number;
  total: number;
  items: T[];
}

export interface CepCodigoIbgeResponse {
  municipio?: number | null;
  estado?: number | null;
  pais?: number | null;
}

export interface CepItemResponse {
  cep?: string | null;
  logradouro?: string | null;
  localidade?: string | null;
  idMunicipio?: number | null;
  nomeMunicipio?: string | null;
  uf?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  dataAtualizacao?: string | null;
  codigoIbge?: CepCodigoIbgeResponse | null;
}

export interface CnaeItemResponse {
  codigo?: string | null;
  descricao?: string | null;
}

export interface CnpjConformidadeResponse {
  cnpj?: string | null;
  cnpjRaiz?: string | null;
  consultadoEm?: string;
  sancoes?: ConformidadeSancoes | null;
  dividaAtiva?: ConformidadeDividaAtiva | null;
  avisos?: string[] | null;
}

export interface CnpjInscricaoEstadualResponse {
  cnpj?: string | null;
  inscricaoEstadual?: string | null;
  uf?: string | null;
  situacao?: string | null;
  cnae?: string | null;
  municipio?: string | null;
  dataAtualizacao?: string | null;
}

export interface CnpjItemResponse {
  cnpj?: string | null;
  razaoSocial?: string | null;
  nomeFantasia?: string | null;
  tipo?: string | null;
  dataAbertura?: string | null;
  situacaoCadastral?: string | null;
  dataSituacaoCadastral?: string | null;
  motivoSituacaoCadastral?: string | null;
  porte?: string | null;
  capitalSocial?: number | null;
  naturezaJuridica?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  cep?: string | null;
  bairro?: string | null;
  municipio?: string | null;
  uf?: string | null;
  email?: string | null;
  telefone?: string | null;
  situacaoEspecial?: string | null;
  dataSituacaoEspecial?: string | null;
  atividadePrincipal?: CnpjItemResponseCode | null;
  atividadeSecundaria?: CnpjItemResponseCode[] | null;
  quadroDeSocios?: CnpjItemResponsePartner[] | null;
  dataAtualizacao?: string | null;
}

export interface CnpjItemResponseCode {
  codigo?: string | null;
  descricao?: string | null;
}

export interface CnpjItemResponsePartner {
  nome?: string | null;
  qualificacao?: string | null;
  representanteLegal?: string | null;
  qualificacaoRepresentanteLegal?: string | null;
  paisOrigem?: string | null;
}

export interface CnpjRelacionamentoAlvo {
  cnpj?: string | null;
  cnpjRaiz?: string | null;
  razaoSocial?: string | null;
  nomeFantasia?: string | null;
  situacaoCadastral?: string | null;
  capitalSocial?: number | null;
  uf?: string | null;
  municipio?: string | null;
}

export interface CnpjRelacionamentoAtividadeResumo {
  codigo?: string | null;
  descricao?: string | null;
  quantidade?: number;
}

export interface CnpjRelacionamentoEmpresa {
  cnpj?: string | null;
  cnpjRaiz?: string | null;
  razaoSocial?: string | null;
  nomeFantasia?: string | null;
  situacaoCadastral?: string | null;
  dataAbertura?: string | null;
  porte?: string | null;
  capitalSocial?: number | null;
  uf?: string | null;
  municipio?: string | null;
  atividadePrincipal?: CnpjItemResponseCode | null;
  sociosEmComum?: CnpjRelacionamentoSocioEmComum[] | null;
}

export interface CnpjRelacionamentoGrafo {
  nodes?: CnpjRelacionamentoGrafoNode[] | null;
  edges?: CnpjRelacionamentoGrafoEdge[] | null;
}

export interface CnpjRelacionamentoGrafoEdge {
  source?: string | null;
  target?: string | null;
  papel?: string | null;
}

export interface CnpjRelacionamentoGrafoNode {
  id?: string | null;
  tipo?: string | null;
  label?: string | null;
  cnpjRaiz?: string | null;
  hashSocio?: string | null;
  isAlvo?: boolean | null;
  situacao?: string | null;
}

export interface CnpjRelacionamentoResponse {
  alvo?: CnpjRelacionamentoAlvo | null;
  resumo?: CnpjRelacionamentoResumo | null;
  socios?: CnpjRelacionamentoSocio[] | null;
  empresasRelacionadas?: Page<CnpjRelacionamentoEmpresa> | null;
  grafo?: CnpjRelacionamentoGrafo | null;
}

export interface CnpjRelacionamentoResumo {
  totalSocios?: number;
  totalEmpresasRelacionadas?: number;
  totalEmpresasAtivas?: number;
  totalEmpresasInativas?: number;
  capitalSocialConsolidado?: number;
  ufs?: string[] | null;
  atividadesPrincipais?: CnpjRelacionamentoAtividadeResumo[] | null;
  totalSociosVerificaveis?: number;
  vinculosCompletos?: boolean;
  avisos?: string[] | null;
}

export interface CnpjRelacionamentoSocio {
  hashSocio?: string | null;
  nome?: string | null;
  tipo?: string | null;
  documento?: string | null;
  qualificacao?: string | null;
  faixaEtaria?: string | null;
  totalEmpresas?: number;
  vinculoVerificavel?: boolean;
}

export interface CnpjRelacionamentoSocioEmComum {
  hashSocio?: string | null;
  nome?: string | null;
  qualificacao?: string | null;
  dataEntradaSociedade?: string | null;
}

export interface CnpjSimplesResponse {
  cnpj?: string | null;
  opcaoPeloSimples?: boolean | null;
  dataOpcaoPeloSimples?: string | null;
  dataExclusaoDoSimples?: string | null;
  opcaoPeloMEI?: boolean | null;
  dataOpcaoPeloMEI?: string | null;
  dataExclusaoDoMEI?: string | null;
  dataAtualizacao?: string | null;
}

export interface CnpjSimplifiedResponse {
  cnpj?: string | null;
  razaoSocial?: string | null;
  situacaoCadastral?: string | null;
  uf?: string | null;
}

export interface ConformidadeDividaAtiva {
  fonte?: string | null;
  disponivel?: boolean;
  referencia?: string | null;
  consta?: boolean | null;
  total?: ConformidadeSoma | null;
  emCobranca?: ConformidadeSoma | null;
  regularizada?: ConformidadeSoma | null;
  ajuizada?: ConformidadeSoma | null;
  origem?: ConformidadeOrigem | null;
  corresponsavel?: ConformidadeSoma | null;
  inscricaoMaisAntiga?: string | null;
  inscricaoMaisRecente?: string | null;
}

export interface ConformidadeOrigem {
  tributaria?: ConformidadeSoma | null;
  previdenciaria?: ConformidadeSoma | null;
  fgts?: ConformidadeSoma | null;
}

export interface ConformidadeSancao {
  cadastro?: string | null;
  cadastroDescricao?: string | null;
  cnpj?: string | null;
  codigo?: string | null;
  categoria?: string | null;
  inicio?: string | null;
  fim?: string | null;
  vigente?: boolean;
  orgao?: string | null;
  uf?: string | null;
  esfera?: string | null;
  abrangencia?: string | null;
  processo?: string | null;
  valorMulta?: number | null;
}

export interface ConformidadeSancoes {
  fonte?: string | null;
  disponivel?: boolean;
  referencia?: string | null;
  consta?: boolean | null;
  vigente?: boolean | null;
  cadastrosVigentes?: string[] | null;
  registros?: ConformidadeSancao[] | null;
}

export interface ConformidadeSoma {
  valor?: number;
  inscricoes?: number;
}

export interface EstadoItemResponse {
  uf?: string | null;
  nome?: string | null;
  totalEstabelecimentos?: number | null;
}

export interface ExtraCreditsInfo {
  remaining?: number;
}

export interface IErrorCodeModel {
  status?: string | null;
  code?: number;
  message?: string | null;
}

export interface LimitsInfo {
  requestsPerMinute?: number;
  allowExternalSearch?: boolean;
  canLiveSearch?: boolean;
}

export interface MercadoCnaeMes {
  mes?: string | null;
  aberturas?: number;
  baixas?: number;
  saldo?: number;
  parcial?: boolean;
}

export interface MercadoCnaeMunicipio {
  id?: number | null;
  nome?: string | null;
  uf?: string | null;
  ativas?: number;
  populacaoEstimada?: number | null;
  ativasPor10MilHabitantes?: number | null;
}

export interface MercadoCnaeNacional {
  total?: number;
  ativas?: number;
  ativasMei?: number;
  ativasSimples?: number;
  porte?: MercadoCnaePorte[] | null;
}

export interface MercadoCnaePorte {
  codigo?: string | null;
  descricao?: string | null;
  ativas?: number;
}

export interface MercadoCnaeResponse {
  cnae?: CnpjItemResponseCode | null;
  disponivel?: boolean;
  geradoEm?: string | null;
  nacional?: MercadoCnaeNacional | null;
  ufs?: MercadoCnaeUf[] | null;
  uf?: MercadoCnaeUf | null;
  maioresMunicipios?: MercadoCnaeMunicipio[] | null;
  tendencia?: MercadoCnaeMes[] | null;
  avisos?: string[] | null;
}

export interface MercadoCnaeUf {
  uf?: string | null;
  ativas?: number;
  participacaoPercentual?: number;
  posicao?: number;
}

export interface MercadoIndicadorPonto {
  periodo?: string | null;
  ano?: number;
  mes?: number | null;
  valor?: number;
}

export interface MercadoIndicadorResponse {
  tipo?: string | null;
  descricao?: string | null;
  unidade?: string | null;
  fonte?: string | null;
  disponivel?: boolean;
  serie?: MercadoIndicadorPonto[] | null;
  avisos?: string[] | null;
}

export interface MercadoMunicipioDados {
  id?: number;
  nome?: string | null;
  uf?: string | null;
  codigoIbge?: string | null;
  regiao?: string | null;
  mesorregiao?: string | null;
  microrregiao?: string | null;
  populacaoEstimada?: number | null;
  areaKm2?: number | null;
  densidadeDemografica?: number | null;
}

export interface MercadoMunicipioEconomia {
  pibMilReais?: number | null;
  pibPerCapitaReais?: number | null;
  anoPib?: number | null;
  anoPopulacao?: number | null;
  atualizadoEm?: string | null;
}

export interface MercadoMunicipioEmpresas {
  estabelecimentosAtivos?: number | null;
  ativosPorMilHabitantes?: number | null;
}

export interface MercadoMunicipioResponse {
  municipio?: MercadoMunicipioDados | null;
  economia?: MercadoMunicipioEconomia | null;
  empresas?: MercadoMunicipioEmpresas | null;
  avisos?: string[] | null;
}

export interface MunicipioDetalhadoResponse {
  id?: number;
  descricao?: string | null;
  uf?: string | null;
  codigoIbge?: string | null;
  populacaoEstimada?: number | null;
  regiao?: string | null;
  mesorregiao?: MunicipioHierarquiaResponse | null;
  microrregiao?: MunicipioHierarquiaResponse | null;
  regiaoImediata?: MunicipioHierarquiaResponse | null;
  regiaoIntermediaria?: MunicipioHierarquiaResponse | null;
  ibgeAtualizadoEm?: string | null;
  totalEmpresas?: number | null;
}

export interface MunicipioHierarquiaResponse {
  codigo?: string | null;
  nome?: string | null;
}

export interface MunicipioItemResponse {
  id?: number;
  descricao?: string | null;
  uf?: string | null;
}

export interface PlanCreditsInfo {
  allocated?: number;
  remaining?: number;
}

export interface SocioEmpresaItemResponse {
  cnpj?: string | null;
  cnpjRaiz?: string | null;
  razaoSocial?: string | null;
  nomeFantasia?: string | null;
  situacaoCadastral?: string | null;
  dataAbertura?: string | null;
  porte?: string | null;
  capitalSocial?: number | null;
  uf?: string | null;
  municipio?: string | null;
  atividadePrincipal?: CnpjItemResponseCode | null;
  qualificacao?: string | null;
  qualificacaoSocio?: string | null;
  dataEntradaSociedade?: string | null;
}

export interface SocioEmpresasResponse {
  socio?: SocioInfoResponse | null;
  resumo?: SocioResumoResponse | null;
  empresas?: Page<SocioEmpresaItemResponse> | null;
}

export interface SocioInfoResponse {
  hashSocio?: string | null;
  nome?: string | null;
  documento?: string | null;
  tipo?: string | null;
  faixaEtaria?: string | null;
  vinculoVerificavel?: boolean;
  avisos?: string[] | null;
}

export interface SocioResumoResponse {
  totalEmpresas?: number;
  totalAtivas?: number;
  totalInativas?: number;
  capitalSocialConsolidado?: number;
  ufs?: string[] | null;
  qualificacoes?: string[] | null;
}

export interface WorkspaceCreditsResponse {
  workspaceId?: number;
  monthReference?: string | null;
  planCredits?: PlanCreditsInfo | null;
  extraCredits?: ExtraCreditsInfo | null;
  totalRemainingCredits?: number;
  limits?: LimitsInfo | null;
}
