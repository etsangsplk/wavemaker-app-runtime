/**
 * Copyright © 2013 - 2017 WaveMaker, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.wavemaker.runtime.data.export.nativesql;

import java.io.ByteArrayOutputStream;
import java.sql.ResultSet;

import org.apache.poi.ss.usermodel.Workbook;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.wavemaker.runtime.data.export.DataExporter;
import com.wavemaker.runtime.data.export.ExportType;

/**
 * @author <a href="mailto:anusha.dharmasagar@wavemaker.com">Anusha Dharmasagar</a>
 * @since 7/11/16
 */
public class NativeSQLDataExporter extends DataExporter {


    private static final Logger logger = LoggerFactory.getLogger(NativeSQLDataExporter.class);

    private ResultSet results;

    public NativeSQLDataExporter(ResultSet results) {
        this.results = results;
    }


    @Override
    public ByteArrayOutputStream export(ExportType exportType, Class<?> responseType) {
        logger.info(
                "Exporting all Records matching the given input query to the given exportType format " + exportType);
        Workbook workbook = NativeSQLExportBuilder.build(responseType, results);
        return exportWorkbook(workbook, exportType);
    }
}
