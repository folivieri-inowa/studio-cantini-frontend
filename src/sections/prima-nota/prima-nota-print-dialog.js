import { useState } from 'react';
import PropTypes from 'prop-types';

import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Checkbox from '@mui/material/Checkbox';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import FormControlLabel from '@mui/material/FormControlLabel';

import Iconify from '../../components/iconify';
import { useSnackbar } from '../../components/snackbar';

// ----------------------------------------------------------------------

export default function PrimaNotaPrintDialog({ transactions, open, onClose }) {
    const [isLoading, setIsLoading] = useState(false);
    const [options, setOptions] = useState({
        includeDateRange: true,
        includeBankAccount: true,
        includeCategory: true,
        includeSubject: true,
        includeDetail: true,
        groupByAccount: true, // Raggruppa per conto di default
    });

    const { enqueueSnackbar } = useSnackbar();

    const handleOptionChange = (option) => (event) => {
        setOptions({ ...options, [option]: event.target.checked });
    };

    const handlePrint = async () => {
        try {
            setIsLoading(true);

            // Importa jsPDF dinamicamente
            const jsPDFModule = await import('jspdf');
            const jsPDF = jsPDFModule.default || jsPDFModule.jsPDF;

            // Crea un nuovo documento PDF
            const doc = new jsPDF();

            // Aggiungi il titolo
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.text('Elenco Movimenti', 105, 20, { align: 'center' });

            // Prepara i breadcrumbs
            let yPosition = 35;
            const breadcrumbs = [];

            if (transactions && transactions.length > 0) {
                // Data range
                if (options.includeDateRange) {
                    const dates = transactions.map(t => new Date(t.date)).sort((a, b) => a - b);
                    if (dates.length > 0) {
                        const startDate = dates[0].toLocaleDateString('it-IT');
                        const endDate = dates[dates.length - 1].toLocaleDateString('it-IT');
                        breadcrumbs.push(`Periodo: ${startDate} - ${endDate}`);
                    }
                }

                // Conto corrente - mostra tutti i conti se più di uno
                if (options.includeBankAccount) {
                    const bankAccounts = [...new Set(transactions.map(t => t.ownername).filter(Boolean))];
                    if (bankAccounts.length === 1) {
                        breadcrumbs.push(`Conto: ${bankAccounts[0]}`);
                    } else if (bankAccounts.length > 1) {
                        breadcrumbs.push(`Conti: ${bankAccounts.join(', ')}`);
                    }
                }

                // Categoria - solo se tutte le transazioni hanno la stessa categoria
                if (options.includeCategory) {
                    const categories = [...new Set(transactions.map(t => t.category_name).filter(Boolean))];
                    if (categories.length === 1) {
                        breadcrumbs.push(`Categoria: ${categories[0]}`);
                    }
                }

                // Soggetto - solo se tutte le transazioni hanno lo stesso soggetto
                if (options.includeSubject) {
                    const subjects = [...new Set(transactions.map(t => t.subject_name).filter(Boolean))];
                    if (subjects.length === 1) {
                        breadcrumbs.push(`Soggetto: ${subjects[0]}`);
                    }
                }

                // Dettaglio - solo se tutte le transazioni hanno lo stesso dettaglio
                if (options.includeDetail) {
                    const details = [...new Set(transactions.map(t => t.detail_name).filter(Boolean))];
                    if (details.length === 1) {
                        breadcrumbs.push(`Dettaglio: ${details[0]}`);
                    }
                }
            }

            // Aggiungi breadcrumbs
            if (breadcrumbs.length > 0) {
                doc.setFontSize(9);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(100);
                const breadcrumbText = breadcrumbs.join(' • ');
                doc.text(breadcrumbText, 14, yPosition);
                yPosition += 10;
            }

            // Disegna la tabella manualmente (senza colonna categoria)
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(0);
            doc.setFillColor(245, 245, 245);

            // Header della tabella - Checkbox, Data, Descrizione, Conto, Importo
            const startY = yPosition;
            const rowHeight = 8;
            const checkboxSize = 4;
            const colWidths = [8, 22, 95, 32, 30]; // Checkbox + colonne
            const colPositions = [14, 22, 44, 139, 171];

            // Disegna sfondo header
            doc.rect(14, startY, 190, rowHeight, 'F');

            // Testo header (con checkbox)
            doc.text('☐', colPositions[0], startY + 6);
            doc.text('Data', colPositions[1], startY + 6);
            doc.text('Descrizione', colPositions[2], startY + 6);
            doc.text('Conto', colPositions[3], startY + 6);
            doc.text('Importo', colPositions[4], startY + 6);

            yPosition = startY + rowHeight;

            // Raggruppa le transazioni per conto se richiesto
            const safeTransactions = Array.isArray(transactions) ? transactions : [];
            const transactionsToProcess = options.groupByAccount
                ? [...safeTransactions].sort((a, b) => {
                    const ownerA = a.ownername || '';
                    const ownerB = b.ownername || '';
                    return ownerA.localeCompare(ownerB);
                })
                : safeTransactions;

            // Disegna le righe
            doc.setFont('helvetica', 'normal');
            let total = 0;
            let currentAccount = null;
            let accountSubtotal = 0;

            transactionsToProcess.forEach((transaction, index) => {
                // Se raggruppiamo per conto e cambia il conto, aggiungi separatore
                if (options.groupByAccount && transaction.ownername !== currentAccount) {
                    // Se non è il primo gruppo, aggiungi subtotale del gruppo precedente
                    if (currentAccount !== null && accountSubtotal !== 0) {
                        yPosition += 3;
                        doc.setFont('helvetica', 'bold');
                        doc.setFontSize(9);
                        doc.text(`Subtotale ${currentAccount}:`, 139, yPosition + 6);
                        const subtotalFormatted = new Intl.NumberFormat('it-IT', {
                            style: 'currency',
                            currency: 'EUR'
                        }).format(accountSubtotal);
                        doc.text(subtotalFormatted, 200, yPosition + 6, { align: 'right' });
                        yPosition += 10;
                        accountSubtotal = 0;
                    }

                    // Controlla se serve una nuova pagina per il separatore
                    if (yPosition > 260) {
                        doc.addPage();
                        yPosition = 20;
                    }

                    // Aggiungi intestazione del gruppo
                    currentAccount = transaction.ownername;
                    doc.setFillColor(230, 230, 230);
                    doc.rect(14, yPosition, 190, 7, 'F');
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(10);
                    doc.text(`Conto: ${currentAccount || 'Non specificato'}`, 16, yPosition + 5);
                    yPosition += 7;
                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(9);
                }
                // Prepara la descrizione con text wrapping
                const description = transaction.description || '-';
                const maxWidth = colWidths[2] - 4; // Larghezza massima per la descrizione
                const descriptionLines = doc.splitTextToSize(description, maxWidth);
                const lineHeight = 5;
                const cellHeight = Math.max(rowHeight, descriptionLines.length * lineHeight + 2);

                // Controlla se serve una nuova pagina
                if (yPosition + cellHeight > 270) {
                    doc.addPage();
                    yPosition = 20;
                }

                // Alterna colore di sfondo
                if (index % 2 === 0) {
                    doc.setFillColor(250, 250, 250);
                    doc.rect(14, yPosition, 190, cellHeight, 'F');
                }

                // Checkbox vuota
                doc.rect(colPositions[0], yPosition + 2, checkboxSize, checkboxSize);

                // Data
                const date = new Date(transaction.date).toLocaleDateString('it-IT');
                doc.text(date, colPositions[1], yPosition + 6);

                // Descrizione con text wrapping
                doc.text(descriptionLines, colPositions[2], yPosition + 5);

                // Conto
                const owner = transaction.ownername || '-';
                doc.text(owner, colPositions[3], yPosition + 6);

                // Importo
                const amount = new Intl.NumberFormat('it-IT', {
                    style: 'currency',
                    currency: 'EUR'
                }).format(transaction.amount);
                doc.text(amount, 200, yPosition + 6, { align: 'right' });
                total += parseFloat(transaction.amount || 0);

                // Accumula il subtotale del gruppo se stiamo raggruppando
                if (options.groupByAccount) {
                    accountSubtotal += parseFloat(transaction.amount || 0);
                }

                yPosition += cellHeight;
            });

            // Aggiungi subtotale dell'ultimo gruppo se stiamo raggruppando
            if (options.groupByAccount && currentAccount !== null && accountSubtotal !== 0) {
                yPosition += 3;
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(9);
                doc.text(`Subtotale ${currentAccount}:`, 139, yPosition + 6);
                const subtotalFormatted = new Intl.NumberFormat('it-IT', {
                    style: 'currency',
                    currency: 'EUR'
                }).format(accountSubtotal);
                doc.text(subtotalFormatted, 200, yPosition + 6, { align: 'right' });
                yPosition += 7;
            }

            // Linea separatrice prima del totale
            yPosition += 5;
            doc.setLineWidth(0.5);
            doc.line(14, yPosition, 204, yPosition);
            yPosition += 8;

            // Totale
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(11);
            doc.text('Totale:', 154, yPosition);
            const totalFormatted = new Intl.NumberFormat('it-IT', {
                style: 'currency',
                currency: 'EUR'
            }).format(total);
            doc.text(totalFormatted, 200, yPosition, { align: 'right' });

            // Footer su tutte le pagine
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i += 1) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(150);
                doc.text(
                    `Generato il ${new Date().toLocaleDateString('it-IT')} alle ${new Date().toLocaleTimeString('it-IT')}`,
                    105,
                    285,
                    { align: 'center' }
                );
            }

            // Apri il PDF in una nuova finestra
            const pdfBlob = doc.output('blob');
            const url = URL.createObjectURL(pdfBlob);
            window.open(url, '_blank');

            // Pulisci l'URL dopo un po' di tempo
            setTimeout(() => {
                URL.revokeObjectURL(url);
            }, 100);

            enqueueSnackbar('PDF generato con successo', { variant: 'success' });
            onClose();
        } catch (error) {
            console.error('Errore durante la generazione del PDF:', error);
            enqueueSnackbar('Errore durante la generazione del PDF', { variant: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog fullWidth maxWidth="xs" open={open} onClose={onClose}>
            <DialogTitle>
                <Stack direction="row" alignItems="center" spacing={1}>
                    <Iconify icon="solar:printer-bold" width={24} />
                    <span>Opzioni di stampa</span>
                </Stack>
            </DialogTitle>

            <DialogContent>
                {transactions && transactions.length > 0 && (
                    <Stack spacing={1} sx={{ mb: 2, p: 2, bgcolor: 'info.lighter', borderRadius: 1 }}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                            <Iconify icon="solar:info-circle-bold" width={20} color="info.main" />
                            <span style={{ fontSize: '14px', fontWeight: 500 }}>
                                {transactions.length} {transactions.length === 1 ? 'voce selezionata' : 'voci selezionate'}
                            </span>
                        </Stack>
                    </Stack>
                )}

                <Stack spacing={2} sx={{ mt: 2 }}>
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={options.groupByAccount}
                                onChange={handleOptionChange('groupByAccount')}
                            />
                        }
                        label="Raggruppa per conto"
                    />
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={options.includeDateRange}
                                onChange={handleOptionChange('includeDateRange')}
                            />
                        }
                        label="Includi intervallo date"
                    />
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={options.includeBankAccount}
                                onChange={handleOptionChange('includeBankAccount')}
                            />
                        }
                        label="Includi conto corrente"
                    />
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={options.includeCategory}
                                onChange={handleOptionChange('includeCategory')}
                            />
                        }
                        label="Includi categoria"
                    />
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={options.includeSubject}
                                onChange={handleOptionChange('includeSubject')}
                            />
                        }
                        label="Includi soggetto"
                    />
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={options.includeDetail}
                                onChange={handleOptionChange('includeDetail')}
                            />
                        }
                        label="Includi dettaglio"
                    />
                </Stack>
            </DialogContent>

            <DialogActions>
                <Button variant="outlined" onClick={onClose}>
                    Annulla
                </Button>
                <LoadingButton
                    variant="contained"
                    loading={isLoading}
                    onClick={handlePrint}
                    startIcon={<Iconify icon="solar:printer-bold" />}
                >
                    Genera PDF
                </LoadingButton>
            </DialogActions>
        </Dialog>
    );
}

PrimaNotaPrintDialog.propTypes = {
    transactions: PropTypes.array,
    open: PropTypes.bool,
    onClose: PropTypes.func,
};
