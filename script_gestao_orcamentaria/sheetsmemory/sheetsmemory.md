# Mapeamento de Memória da Planilha (sheetsmemory)

Este documento descreve a estrutura de colunas e os intervalos de células de cada aba da planilha do Google Sheets utilizada pela automação do ADM63BI. Use este arquivo como referência para futuras atualizações de layouts e células.

---

## 1. Aba: BANCO
Contém os dados brutos extraídos diretamente do sistema SAG (Exercício Corrente, RPNP e NCs).

### Seção 1.1: Disponível UG 160443
* **Intervalo**: `A3:I1000` (linhas 1 e 2 são cabeçalhos)
* **Colunas (0-based / Letra da Coluna)**:
  * `0` (A): UG
  * `1` (B): PROGRAMA
  * `2` (C): AÇÃO
  * `3` (D): UGR
  * `4` (E): PTRES
  * `5` (F): PI
  * `6` (G): ND
  * `7` (H): FONTE
  * `8` (I): DISPONÍVEL

### Seção 1.2: Disponível UG 167443
* **Intervalo**: `K3:S1000` (linhas 1 e 2 são cabeçalhos)
* **Colunas (0-based / Letra da Coluna)**:
  * `10` (K): UG
  * `11` (L): PROGRAMA
  * `12` (M): AÇÃO
  * `13` (N): UGR
  * `14` (O): PTRES
  * `15` (P): PI
  * `16` (Q): ND
  * `17` (R): FONTE
  * `18` (S): DISPONÍVEL

### Seção 1.3: Notas de Créditos Detalhadas (NCs)
* **Intervalo**: `U3:AB2000` (linhas 1 e 2 são cabeçalhos)
* **Colunas (0-based a partir de U / Letra da Coluna)**:
  * `0` (U): UG_FAV (UG destino)
  * `1` (V): DATA_EMISSAO (Data de Emissão / Chegada)
  * `2` (W): DESTINO_PTRES (PTRES)
  * `3` (X): DESTINO_ND (ND)
  * `4` (Y): OBS (Observações)
  * `5` (Z): NUMERO_NC (Número da NC, ex: 2026NC000123)
  * `6` (AA): DESTINO_PI (PI)
  * `7` (AB): DESTINO_VALOR_ITEM (Valor Inicial da NC)

### Seção 1.4: Resumo do Exercício Corrente
* **Intervalo**: `AD3:AM4`

### Seção 1.5: Resumo do RPNP
* **Intervalo**: `AD8:AS9`

### Seção 1.6: Corrente Unificado (via AJAX)
* **Intervalo**: `AU3:AZ1000` (linhas 1 e 2 são cabeçalhos)
* **Colunas (0-based a partir de AU / Letra da Coluna)**:
  * `0` (AU): UG
  * `1` (AV): NE (Nota de Empenho)
  * `2` (AW): TIPO_NE (Ordinário, Estimativo, Global)
  * `3` (AX): DATA_EMISSAO
  * `4` (AY): PI
  * `5` (AZ): A_LIQUIDAR (Saldo do Empenho)

### Seção 1.7: RPNP Unificado (via AJAX)
* **Intervalo**: `BB3:BG1000` (linhas 1 e 2 são cabeçalhos)
* **Colunas (0-based a partir de BB / Letra da Coluna)**:
  * `0` (BB): UG
  * `1` (BC): NE (Nota de Empenho)
  * `2` (BD): TIPO_NE
  * `3` (BE): DATA_EMISSAO
  * `4` (BF): PI
  * `5` (BG): ALIQ (Restos a Pagar a Liquidar)

---

## 2. Aba: Controle EMP 26
Utilizada para gerenciar os empenhos do Exercício Corrente. Os dados de empenhos ativos são importados do BANCO (`AU:AZ`), e o usuário insere dados manualmente nas últimas colunas.

### Seção 2.1: Bloco UG 160443
* **Intervalo**: `A3:I`
* **Colunas (0-based / Letra da Coluna)**:
  * `0` (A): PI
  * `1` (B): NE (Nota de Empenho)
  * `2` (C): TIPO (Ordinário, Estimativo, Global)
  * `3` (D): DIAS (Idade do empenho)
  * `4` (E): SALDO (Valor a liquidar atual)
  * `5` (F): RESP (Setor responsável - ex: ALMOX, FISCALIZAÇÃO)
  * `6` (G): Observação / Preenchimento Manual Usuário
  * `7` (H): Previsão Manual (SIM / NÃO / PARCIAL)
  * `8` (I): Valor Previsão / Parcial Manual

### Seção 2.2: Bloco UG 167443
* **Intervalo**: `K3:S`
* **Colunas (0-based / Letra da Coluna)**:
  * Same mapping as 160443 (shifted by 10 columns)
  * `10` (K): PI
  * `11` (L): NE
  * `12` (M): TIPO
  * `13` (N): DIAS
  * `14` (O): SALDO
  * `15` (P): RESP
  * `16` (Q): Observação / Preenchimento Manual Usuário
  * `17` (R): Previsão Manual (SIM / NÃO / PARCIAL)
  * `18` (S): Valor Previsão / Parcial Manual

---

## 3. Aba: Controle EMP RPNP
Utilizada para gerenciar os empenhos de Restos a Pagar Não Processados. Mesma estrutura do Controle EMP 26, mas com dados de empenhos RPNP importados do BANCO (`BB:BG`).

### Seção 3.1: Bloco UG 160443
* **Intervalo**: `A3:I` (Mesma estrutura de colunas do Controle EMP 26)

### Seção 3.2: Bloco UG 167443
* **Intervalo**: `K3:S` (Mesma estrutura de colunas do Controle EMP 26)

---

## 4. Aba: Créditos na tela
Utilizada para visualizar os créditos disponíveis no BANCO e correlacionar com as Notas de Créditos (NCs) detalhadas.

### Seção 4.1: Bloco UG 160443
* **Intervalo**: `A3:M1000` (Mesclagem dinâmica e cores de prazo aplicadas)
* **Colunas (0-based / Letra da Coluna)**:
  * `0` (A): Responsável/Setor (mesclado)
  * `1` (B): PI (mesclado)
  * `2` (C): Qtd NCs (mesclado)
  * `3` (D): Valor Disponível (mesclado)
  * `4` (E): N° NC
  * `5` (F): Soma Total NCs (mesclado)
  * `6` (G): Valor Emp = Soma - Disp (mesclado)
  * `7` (H): Data Chegada/Emissão
  * `8` (I): Prazo OM (Preenchimento Manual / Utilizada na lógica de cor roxa se contiver "Recolhimento")
  * `9` (J): PTRES
  * `10` (K): ND
  * `11` (L): OBS da NC
  * `12` (M): Providência (Preenchimento Manual)

### Seção 4.2: Bloco UG 167443
* **Intervalo**: `O3:AA1000` (Mescla de colunas relativas iniciada no índice 14)
* **Colunas (0-based / Letra da Coluna)**:
  * Same columns shifted by 14
  * `14` (O): Responsável/Setor
  * `15` (P): PI
  * `16` (Q): Qtd NCs
  * `17` (R): Valor Disponível
  * `18` (S): N° NC
  * `19` (T): Soma Total NCs
  * `20` (U): Valor Emp
  * `21` (V): Data Chegada/Emissão
  * `22` (W): Prazo OM (Preenchimento Manual / Utilizada na lógica de cor roxa se contiver "Recolhimento")
  * `23` (X): PTRES
  * `24` (Y): ND
  * `25` (Z): OBS da NC
  * `26` (AA): Providência

---

## 5. Aba: LOGS
Guarda o histórico diário de empenhos ativos, saldos e previsões, servindo de base para o histórico de novidades de empenhos e relatórios de liquidação.

* **Intervalo**: `A:K` (cabeçalho na linha 1)
* **Colunas (0-based / Letra da Coluna)**:
  * `0` (A): Timestamp
  * `1` (B): Data (dd/mm/aaaa)
  * `2` (C): Categoria ("Empenho Ativo", "Crédito Disponível", "Mudança de Previsão", etc.)
  * `3` (D): UG (160443 ou 167443)
  * `4` (E): Responsável/Setor (normalizado em maiúsculas)
  * `5` (F): PI
  * `6` (G): ND (usado para Créditos)
  * `7` (H): NE (usado para Empenhos)
  * `8` (I): Valor Principal (Saldo atual)
  * `9` (J): Valor Previsão (Parcial)
  * `10` (K): Previsão (SIM / NÃO / PARCIAL)
