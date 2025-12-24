import type { Invoice } from "@/types/invoice";

export const nfseXmlBuilder = {
    buildRps(invoice: Invoice, certificateAlias?: string): string {
        // Standard ABRASF RPS Structure (Simplified)
        // In a real scenario, this would be much more complex with XSD validation

        const timestamp = new Date(invoice.issueDate).toISOString();
        const formattedAmount = invoice.amount.toFixed(2);
        const issAmount = invoice.taxes?.iss.toFixed(2) || "0.00";

        return `<?xml version="1.0" encoding="UTF-8"?>
<Rps xmlns="http://www.abrasf.org.br/nfse.xsd">
    <InfDeclaracaoPrestacaoServico>
        <Rps>
            <IdentificacaoRps>
                <Numero>${invoice.number}</Numero>
                <Serie>A</Serie>
                <Tipo>1</Tipo>
            </IdentificacaoRps>
            <DataEmissao>${timestamp}</DataEmissao>
            <Status>1</Status>
        </Rps>
        <Servico>
            <Valores>
                <ValorServicos>${formattedAmount}</ValorServicos>
                <ValorIss>${issAmount}</ValorIss>
                <Aliquota>0.02</Aliquota>
            </Valores>
            <IssRetido>2</IssRetido>
            <ItemListaServico>${invoice.items[0]?.serviceCode || '1.03'}</ItemListaServico>
            <Discriminacao>${invoice.items[0]?.description || 'Serviços Prestados'}</Discriminacao>
            <CodigoMunicipio>3550308</CodigoMunicipio>
        </Servico>
        <Prestador>
            <Cnpj>00000000000191</Cnpj>
            <InscricaoMunicipal>123456</InscricaoMunicipal>
        </Prestador>
        <Tomador>
            <IdentificacaoTomador>
                <CpfCnpj>
                    <Cnpj>${invoice.borrower.document.replace(/\D/g, '')}</Cnpj>
                </CpfCnpj>
            </IdentificacaoTomador>
            <RazaoSocial>${invoice.borrower.name}</RazaoSocial>
            <Endereco>
                <Endereco>${invoice.borrower.address.street}</Endereco>
                <Numero>${invoice.borrower.address.number}</Numero>
                <Bairro>${invoice.borrower.address.neighborhood}</Bairro>
                <CodigoMunicipio>3550308</CodigoMunicipio>
                <Uf>${invoice.borrower.address.state}</Uf>
                <Cep>${invoice.borrower.address.zipCode.replace(/\D/g, '')}</Cep>
            </Endereco>
            <Contato>
                <Email>${invoice.borrower.email}</Email>
            </Contato>
        </Tomador>
    </InfDeclaracaoPrestacaoServico>
    ${certificateAlias ? `<Signature>${certificateAlias}</Signature>` : ''}
</Rps>`;
    }
};
