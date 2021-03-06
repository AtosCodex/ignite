/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package org.apache.ignite.schema.test.generator;

import java.io.File;
import java.util.ArrayList;
import java.util.Collection;
import org.apache.ignite.schema.generator.XmlGenerator;
import org.apache.ignite.schema.model.PojoDescriptor;
import org.apache.ignite.schema.test.AbstractSchemaImportTest;

/**
 * Tests for XML generator.
 */
public class XmlGeneratorTest extends AbstractSchemaImportTest {
    /**
     * Test that XML generated correctly.
     */
    public void testXmlGeneration() throws Exception {
        Collection<PojoDescriptor> all = new ArrayList<>();

        for (PojoDescriptor pojo : pojos)
            if (pojo.parent() != null)
                all.add(pojo);

        String fileName = "ignite-type-metadata.xml";

        XmlGenerator.generate("org.apache.ignite.schema.test.model", all, true, true, new File(OUT_DIR_PATH, fileName),
            askOverwrite);

        assertTrue("Generated XML file content is differ from expected one",
            compareFilesInt(getClass().getResourceAsStream("/org/apache/ignite/schema/test/model/" + fileName),
                new File(OUT_DIR_PATH + "/" + fileName), "XML generated by Apache Ignite Schema Import utility"));
    }
}
