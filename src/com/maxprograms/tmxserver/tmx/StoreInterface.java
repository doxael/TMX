/*******************************************************************************
 * Copyright (c) 2018-2022 Maxprograms.
 *
 * This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License 1.0
 * which accompanies this distribution, and is available at
 * https://www.eclipse.org/org/documents/epl-v10.html
 *
 * Contributors:
 *     Maxprograms - initial API and implementation
 *******************************************************************************/

package com.maxprograms.tmxserver.tmx;

import java.io.File;
import java.io.IOException;
import java.sql.SQLException;
import java.util.List;
import java.util.Set;

import javax.xml.parsers.ParserConfigurationException;

import org.xml.sax.SAXException;

import com.maxprograms.tmxserver.models.Language;
import com.maxprograms.tmxserver.models.TUnit;
import com.maxprograms.xml.Element;

public interface StoreInterface {

	void storeTU(Element tu) throws IOException, SQLException;

	void storeHeader(Element header);

	Element getHeader();

	Set<String> getLanguages();

	List<TUnit> getUnits(long start, int count, String filterText, Language filterLanguage, boolean caseSensitiveFilter,
			boolean filterUntranslated, boolean regExp, Language filterSrcLanguage, Language sortLanguage,
			boolean ascending) throws IOException, SQLException;

	void close() throws IOException, SQLException;

	long getCount() throws SQLException;

	long getDiscarded();

	String saveData(String id, String lang, String value)
			throws IOException, SQLException, SAXException, ParserConfigurationException;

	void writeFile(File out) throws IOException, SQLException, SAXException, ParserConfigurationException;

	int getSaved();

	void commit() throws IOException, SQLException;

	Element getTu(String id) throws SQLException;

	void delete(List<String> selected) throws SQLException;

	void replaceText(String search, String replace, Language language, boolean regExp)
			throws SQLException, SAXException, IOException, ParserConfigurationException;

	long getProcessed();

	void insertUnit(String id) throws SQLException, IOException;

	long removeUntranslated(Language lang) throws IOException, SQLException;

	void removeSameAsSource(Language lang) throws IOException, SQLException, SAXException, ParserConfigurationException;

	void addLanguage(Language lang) throws IOException, SQLException;

	void removeLanguage(Language lang) throws IOException, SQLException;

	void removeTags() throws SQLException, SAXException, IOException, ParserConfigurationException;

	void changeLanguage(Language oldLanguage, Language newLanguage)
			throws IOException, SQLException, SAXException, ParserConfigurationException;

	void removeDuplicates() throws SQLException, SAXException, IOException, ParserConfigurationException;

	void removeSpaces() throws SAXException, IOException, ParserConfigurationException, SQLException;

	void consolidateUnits(Language lang) throws IOException, SQLException, SAXException, ParserConfigurationException;

	void setTuAttributes(String id, List<String[]> attributes)
			throws SAXException, IOException, ParserConfigurationException, SQLException;

	void setTuvAttributes(String id, String lang, List<String[]> attributes)
			throws SQLException, SAXException, IOException, ParserConfigurationException;

	void setTuProperties(String id, List<String[]> properties)
			throws SQLException, SAXException, IOException, ParserConfigurationException;

	void setTuvProperties(String id, String lang, List<String[]> dataList)
			throws SQLException, SAXException, IOException, ParserConfigurationException;

	void setTuNotes(String id, List<String> notes)
			throws SQLException, SAXException, IOException, ParserConfigurationException;

	void setTuvNotes(String id, String lang, List<String> notes)
			throws SQLException, SAXException, IOException, ParserConfigurationException;

	void exportDelimited(String file) throws IOException, SQLException, SAXException, ParserConfigurationException;

	long getExported();

	Element getTuv(String id, String lang) throws SQLException, SAXException, IOException, ParserConfigurationException;

	void setIndentation(int indentation);

	void exportExcel(String file) throws IOException, SAXException, ParserConfigurationException, SQLException;

}
