import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

// Stili per il documento PDF
const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontSize: 10,
    },
    header: {
        marginBottom: 20,
    },
    title: {
        fontSize: 18,
        marginBottom: 15,
        textAlign: 'center',
    },
    breadcrumbs: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 20,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    breadcrumb: {
        flexDirection: 'row',
        marginRight: 15,
        marginBottom: 5,
    },
    breadcrumbLabel: {
        fontSize: 9,
        color: '#666',
        marginRight: 5,
    },
    breadcrumbValue: {
        fontSize: 9,
        color: '#333',
    },
    table: {
        marginTop: 10,
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
        minHeight: 30,
        alignItems: 'center',
    },
    tableHeaderRow: {
        flexDirection: 'row',
        backgroundColor: '#f5f5f5',
        borderBottomWidth: 2,
        borderBottomColor: '#333',
        minHeight: 35,
        alignItems: 'center',
    },
    tableCol: {
        padding: 8,
    },
    tableColDate: {
        width: '15%',
    },
    tableColDescription: {
        width: '35%',
    },
    tableColOwner: {
        width: '15%',
    },
    tableColAmount: {
        width: '15%',
        textAlign: 'right',
    },
    tableColCategory: {
        width: '20%',
    },
    tableCell: {
        fontSize: 9,
    },
    tableCellHeader: {
        fontSize: 9,
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 40,
        right: 40,
        textAlign: 'center',
        fontSize: 8,
        color: '#999',
    },
    totalRow: {
        flexDirection: 'row',
        marginTop: 15,
        paddingTop: 10,
        borderTopWidth: 2,
        borderTopColor: '#333',
    },
    totalLabel: {
        fontSize: 11,
        flex: 1,
        textAlign: 'right',
        paddingRight: 20,
    },
    totalAmount: {
        fontSize: 11,
        width: '15%',
        textAlign: 'right',
        paddingRight: 8,
    },
});

// Funzione per formattare la data
const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });
};

// Funzione per formattare la valuta
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('it-IT', {
        style: 'currency',
        currency: 'EUR',
    }).format(amount);
};

// Componente principale del documento PDF
export const PrimaNotaPDF = ({ transactions = [], options = {}, filters = {} }) => {
    // Calcola il totale
    const total = transactions.reduce((sum, transaction) => sum + parseFloat(transaction.amount || 0), 0);

    // Prepara i breadcrumbs
    const breadcrumbItems = [];

    if (options.includeDateRange && filters.dateRange) {
        breadcrumbItems.push({
            label: 'Periodo:',
            value: `${formatDate(filters.dateRange.start)} - ${formatDate(filters.dateRange.end)}`,
        });
    }

    if (options.includeBankAccount && filters.bankAccount) {
        breadcrumbItems.push({
            label: 'Conto:',
            value: filters.bankAccount,
        });
    }

    if (options.includeCategory && filters.category) {
        breadcrumbItems.push({
            label: 'Categoria:',
            value: filters.category,
        });
    }

    if (options.includeSubject && filters.subject) {
        breadcrumbItems.push({
            label: 'Soggetto:',
            value: filters.subject,
        });
    }

    if (options.includeDetail && filters.detail) {
        breadcrumbItems.push({
            label: 'Dettaglio:',
            value: filters.detail,
        });
    }

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={styles.header}>
                    <Text style={styles.title}>Elenco Movimenti</Text>

                    {breadcrumbItems.length > 0 && (
                        <View style={styles.breadcrumbs}>
                            {breadcrumbItems.map((item, index) => (
                                <View key={index} style={styles.breadcrumb}>
                                    <Text style={styles.breadcrumbLabel}>{item.label}</Text>
                                    <Text style={styles.breadcrumbValue}>{item.value}</Text>
                                </View>
                            ))}
                        </View>
                    )}
                </View>

                <View style={styles.table}>
                    {/* Header della tabella */}
                    <View style={styles.tableHeaderRow}>
                        <View style={[styles.tableCol, styles.tableColDate]}>
                            <Text style={styles.tableCellHeader}>Data</Text>
                        </View>
                        <View style={[styles.tableCol, styles.tableColDescription]}>
                            <Text style={styles.tableCellHeader}>Descrizione</Text>
                        </View>
                        <View style={[styles.tableCol, styles.tableColOwner]}>
                            <Text style={styles.tableCellHeader}>Conto</Text>
                        </View>
                        <View style={[styles.tableCol, styles.tableColAmount]}>
                            <Text style={styles.tableCellHeader}>Importo</Text>
                        </View>
                        <View style={[styles.tableCol, styles.tableColCategory]}>
                            <Text style={styles.tableCellHeader}>Categoria</Text>
                        </View>
                    </View>

                    {/* Righe della tabella */}
                    {transactions.map((transaction, index) => (
                        <View key={index} style={styles.tableRow}>
                            <View style={[styles.tableCol, styles.tableColDate]}>
                                <Text style={styles.tableCell}>{formatDate(transaction.date)}</Text>
                            </View>
                            <View style={[styles.tableCol, styles.tableColDescription]}>
                                <Text style={styles.tableCell}>{transaction.description || '-'}</Text>
                            </View>
                            <View style={[styles.tableCol, styles.tableColOwner]}>
                                <Text style={styles.tableCell}>{transaction.ownername || '-'}</Text>
                            </View>
                            <View style={[styles.tableCol, styles.tableColAmount]}>
                                <Text style={styles.tableCell}>{formatCurrency(transaction.amount)}</Text>
                            </View>
                            <View style={[styles.tableCol, styles.tableColCategory]}>
                                <Text style={styles.tableCell}>
                                    {transaction.category_name || '-'}
                                    {transaction.subject_name ? ` > ${transaction.subject_name}` : ''}
                                    {transaction.detail_name ? ` > ${transaction.detail_name}` : ''}
                                </Text>
                            </View>
                        </View>
                    ))}
                </View>

                {/* Riga del totale */}
                <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Totale:</Text>
                    <Text style={styles.totalAmount}>{formatCurrency(total)}</Text>
                </View>

                <Text style={styles.footer}>
                    Generato il {new Date().toLocaleDateString('it-IT')} alle {new Date().toLocaleTimeString('it-IT')}
                </Text>
            </Page>
        </Document>
    );
};
