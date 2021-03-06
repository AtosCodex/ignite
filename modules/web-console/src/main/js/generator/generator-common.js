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

// Entry point for common functions for code generation.
const $generatorCommon = {};

// Add leading zero.
$generatorCommon.addLeadingZero = function(numberStr, minSize) {
    if (typeof (numberStr) !== 'string')
        numberStr = String(numberStr);

    while (numberStr.length < minSize)
        numberStr = '0' + numberStr;

    return numberStr;
};

// Format date to string.
$generatorCommon.formatDate = function(date) {
    const dd = $generatorCommon.addLeadingZero(date.getDate(), 2);
    const mm = $generatorCommon.addLeadingZero(date.getMonth() + 1, 2);

    const yyyy = date.getFullYear();

    return mm + '/' + dd + '/' + yyyy + ' ' + $generatorCommon.addLeadingZero(date.getHours(), 2) + ':' + $generatorCommon.addLeadingZero(date.getMinutes(), 2);
};

// Generate comment for generated XML, Java, ... files.
$generatorCommon.mainComment = function mainComment() {
    return 'This configuration was generated by Ignite Web Console (' + $generatorCommon.formatDate(new Date()) + ')';
};

// Create result holder with service functions and properties for XML and java code generation.
$generatorCommon.builder = function(deep) {
    if (_.isNil($generatorCommon.JavaTypes))
        $generatorCommon.JavaTypes = angular.element(document.getElementById('app')).injector().get('JavaTypes');

    const res = [];

    res.deep = deep || 0;
    res.needEmptyLine = false;
    res.lineStart = true;
    res.datasources = [];
    res.imports = {};
    res.staticImports = {};
    res.vars = {};

    res.safeDeep = 0;
    res.safeNeedEmptyLine = false;
    res.safeImports = {};
    res.safeDatasources = [];
    res.safePoint = -1;

    res.mergeProps = function(fromRes) {
        if ($generatorCommon.isDefinedAndNotEmpty(fromRes)) {
            res.datasources = fromRes.datasources;

            angular.extend(res.imports, fromRes.imports);
            angular.extend(res.staticImports, fromRes.staticImports);
            angular.extend(res.vars, fromRes.vars);
        }
    };

    res.mergeLines = function(fromRes) {
        if ($generatorCommon.isDefinedAndNotEmpty(fromRes)) {
            if (res.needEmptyLine)
                res.push('');

            _.forEach(fromRes, function(line) {
                res.append(line);
            });
        }
    };

    res.startSafeBlock = function() {
        res.safeDeep = this.deep;
        this.safeNeedEmptyLine = this.needEmptyLine;
        this.safeImports = _.cloneDeep(this.imports);
        this.safeStaticImports = _.cloneDeep(this.staticImports);
        this.safeDatasources = this.datasources.slice();
        this.safePoint = this.length;
    };

    res.rollbackSafeBlock = function() {
        if (this.safePoint >= 0) {
            this.splice(this.safePoint, this.length - this.safePoint);

            this.deep = res.safeDeep;
            this.needEmptyLine = this.safeNeedEmptyLine;
            this.datasources = this.safeDatasources;
            this.imports = this.safeImports;
            this.staticImports = this.safeStaticImports;
            this.safePoint = -1;
        }
    };

    res.asString = function() {
        return this.join('\n');
    };

    res.append = function(s) {
        this.push((this.lineStart ? _.repeat('    ', this.deep) : '') + s);

        return this;
    };

    res.line = function(s) {
        if (s) {
            if (res.needEmptyLine)
                res.push('');

            res.append(s);
        }

        res.needEmptyLine = false;

        res.lineStart = true;

        return res;
    };

    res.startBlock = function(s) {
        if (s) {
            if (this.needEmptyLine)
                this.push('');

            this.append(s);
        }

        this.needEmptyLine = false;

        this.lineStart = true;

        this.deep++;

        return this;
    };

    res.endBlock = function(s) {
        this.deep--;

        if (s)
            this.append(s);

        this.lineStart = true;

        return this;
    };

    res.softEmptyLine = function() {
        this.needEmptyLine = this.length > 0;
    };

    res.emptyLineIfNeeded = function() {
        if (this.needEmptyLine) {
            this.push('');
            this.lineStart = true;

            this.needEmptyLine = false;
        }
    };

    /**
     * Add class to imports.
     *
     * @param clsName Full class name.
     * @returns {String} Short class name or full class name in case of names conflict.
     */
    res.importClass = function(clsName) {
        if ($generatorCommon.JavaTypes.isJavaPrimitive(clsName))
            return clsName;

        const fullClassName = $generatorCommon.JavaTypes.fullClassName(clsName);

        const dotIdx = fullClassName.lastIndexOf('.');

        const shortName = dotIdx > 0 ? fullClassName.substr(dotIdx + 1) : fullClassName;

        if (this.imports[shortName]) {
            if (this.imports[shortName] !== fullClassName)
                return fullClassName; // Short class names conflict. Return full name.
        }
        else
            this.imports[shortName] = fullClassName;

        return shortName;
    };

    /**
     * Add class to imports.
     *
     * @param member Static member.
     * @returns {String} Short class name or full class name in case of names conflict.
     */
    res.importStatic = function(member) {
        const dotIdx = member.lastIndexOf('.');

        const shortName = dotIdx > 0 ? member.substr(dotIdx + 1) : member;

        if (this.staticImports[shortName]) {
            if (this.staticImports[shortName] !== member)
                return member; // Short class names conflict. Return full name.
        }
        else
            this.staticImports[shortName] = member;

        return shortName;
    };

    /**
     * @returns String with "java imports" section.
     */
    res.generateImports = function() {
        const genImports = [];

        for (const clsName in this.imports) {
            if (this.imports.hasOwnProperty(clsName) && this.imports[clsName].lastIndexOf('java.lang.', 0) !== 0)
                genImports.push('import ' + this.imports[clsName] + ';');
        }

        genImports.sort();

        return genImports.join('\n');
    };

    /**
     * @returns String with "java imports" section.
     */
    res.generateStaticImports = function() {
        const statImports = [];

        for (const clsName in this.staticImports) {
            if (this.staticImports.hasOwnProperty(clsName) && this.staticImports[clsName].lastIndexOf('java.lang.', 0) !== 0)
                statImports.push('import static ' + this.staticImports[clsName] + ';');
        }

        statImports.sort();

        return statImports.join('\n');
    };

    return res;
};

// Eviction policies code generation descriptors.
$generatorCommon.EVICTION_POLICIES = {
    LRU: {
        className: 'org.apache.ignite.cache.eviction.lru.LruEvictionPolicy',
        fields: {batchSize: {dflt: 1}, maxMemorySize: null, maxSize: {dflt: 100000}}
    },
    FIFO: {
        className: 'org.apache.ignite.cache.eviction.fifo.FifoEvictionPolicy',
        fields: {batchSize: {dflt: 1}, maxMemorySize: null, maxSize: {dflt: 100000}}
    },
    SORTED: {
        className: 'org.apache.ignite.cache.eviction.sorted.SortedEvictionPolicy',
        fields: {batchSize: {dflt: 1}, maxMemorySize: null, maxSize: {dflt: 100000}}
    }
};

// Marshaller code generation descriptors.
$generatorCommon.MARSHALLERS = {
    OptimizedMarshaller: {
        className: 'org.apache.ignite.marshaller.optimized.OptimizedMarshaller',
        fields: {poolSize: null, requireSerializable: null }
    },
    JdkMarshaller: {
        className: 'org.apache.ignite.marshaller.jdk.JdkMarshaller',
        fields: {}
    }
};

// Pairs of supported databases and their JDBC dialects.
$generatorCommon.JDBC_DIALECTS = {
    Generic: 'org.apache.ignite.cache.store.jdbc.dialect.BasicJdbcDialect',
    Oracle: 'org.apache.ignite.cache.store.jdbc.dialect.OracleDialect',
    DB2: 'org.apache.ignite.cache.store.jdbc.dialect.DB2Dialect',
    SQLServer: 'org.apache.ignite.cache.store.jdbc.dialect.SQLServerDialect',
    MySQL: 'org.apache.ignite.cache.store.jdbc.dialect.MySQLDialect',
    PostgreSQL: 'org.apache.ignite.cache.store.jdbc.dialect.BasicJdbcDialect',
    H2: 'org.apache.ignite.cache.store.jdbc.dialect.H2Dialect'
};

// Return JDBC dialect full class name for specified database.
$generatorCommon.jdbcDialectClassName = function(db) {
    const dialectClsName = $generatorCommon.JDBC_DIALECTS[db];

    return dialectClsName ? dialectClsName : 'Unknown database: ' + db;
};

// Generate default data cache for specified igfs instance.
$generatorCommon.igfsDataCache = function(igfs) {
    return {
        name: igfs.name + '-data',
        cacheMode: 'PARTITIONED',
        atomicityMode: 'TRANSACTIONAL',
        writeSynchronizationMode: 'FULL_SYNC',
        backups: 0,
        igfsAffinnityGroupSize: igfs.affinnityGroupSize || 512
    };
};

// Generate default meta cache for specified igfs instance.
$generatorCommon.igfsMetaCache = function(igfs) {
    return {
        name: igfs.name + '-meta',
        cacheMode: 'REPLICATED',
        atomicityMode: 'TRANSACTIONAL',
        writeSynchronizationMode: 'FULL_SYNC'
    };
};

// Pairs of supported databases and their data sources.
$generatorCommon.DATA_SOURCES = {
    Generic: 'com.mchange.v2.c3p0.ComboPooledDataSource',
    Oracle: 'oracle.jdbc.pool.OracleDataSource',
    DB2: 'com.ibm.db2.jcc.DB2DataSource',
    SQLServer: 'com.microsoft.sqlserver.jdbc.SQLServerDataSource',
    MySQL: 'com.mysql.jdbc.jdbc2.optional.MysqlDataSource',
    PostgreSQL: 'org.postgresql.ds.PGPoolingDataSource',
    H2: 'org.h2.jdbcx.JdbcDataSource'
};

// Return data source full class name for specified database.
$generatorCommon.dataSourceClassName = function(db) {
    const dsClsName = $generatorCommon.DATA_SOURCES[db];

    return dsClsName ? dsClsName : 'Unknown database: ' + db;
};

// Store factories code generation descriptors.
$generatorCommon.STORE_FACTORIES = {
    CacheJdbcPojoStoreFactory: {
        className: 'org.apache.ignite.cache.store.jdbc.CacheJdbcPojoStoreFactory',
        suffix: 'JdbcPojo',
        fields: {
            configuration: {type: 'bean'}
        }
    },
    CacheJdbcBlobStoreFactory: {
        className: 'org.apache.ignite.cache.store.jdbc.CacheJdbcBlobStoreFactory',
        suffix: 'JdbcBlob',
        fields: {
            initSchema: null,
            createTableQuery: null,
            loadQuery: null,
            insertQuery: null,
            updateQuery: null,
            deleteQuery: null
        }
    },
    CacheHibernateBlobStoreFactory: {
        className: 'org.apache.ignite.cache.store.hibernate.CacheHibernateBlobStoreFactory',
        suffix: 'Hibernate',
        fields: {hibernateProperties: {type: 'propertiesAsList', propVarName: 'props'}}
    }
};

// Swap space SPI code generation descriptor.
$generatorCommon.SWAP_SPACE_SPI = {
    className: 'org.apache.ignite.spi.swapspace.file.FileSwapSpaceSpi',
    fields: {
        baseDirectory: {type: 'path'},
        readStripesNumber: null,
        maximumSparsity: {type: 'float'},
        maxWriteQueueSize: null,
        writeBufferSize: null
    }
};

// Transaction configuration code generation descriptor.
$generatorCommon.TRANSACTION_CONFIGURATION = {
    className: 'org.apache.ignite.configuration.TransactionConfiguration',
    fields: {
        defaultTxConcurrency: {type: 'enum', enumClass: 'org.apache.ignite.transactions.TransactionConcurrency', dflt: 'PESSIMISTIC'},
        defaultTxIsolation: {type: 'enum', enumClass: 'org.apache.ignite.transactions.TransactionIsolation', dflt: 'REPEATABLE_READ'},
        defaultTxTimeout: {dflt: 0},
        pessimisticTxLogLinger: {dflt: 10000},
        pessimisticTxLogSize: null,
        txSerializableEnabled: null,
        txManagerFactory: {type: 'bean'}
    }
};

// SSL configuration code generation descriptor.
$generatorCommon.SSL_CONFIGURATION_TRUST_FILE_FACTORY = {
    className: 'org.apache.ignite.ssl.SslContextFactory',
    fields: {
        keyAlgorithm: null,
        keyStoreFilePath: {type: 'path'},
        keyStorePassword: {type: 'raw'},
        keyStoreType: null,
        protocol: null,
        trustStoreFilePath: {type: 'path'},
        trustStorePassword: {type: 'raw'},
        trustStoreType: null
    }
};

// SSL configuration code generation descriptor.
$generatorCommon.SSL_CONFIGURATION_TRUST_MANAGER_FACTORY = {
    className: 'org.apache.ignite.ssl.SslContextFactory',
    fields: {
        keyAlgorithm: null,
        keyStoreFilePath: {type: 'path'},
        keyStorePassword: {type: 'raw'},
        keyStoreType: null,
        protocol: null,
        trustManagers: {type: 'array'}
    }
};

// Communication configuration code generation descriptor.
$generatorCommon.CONNECTOR_CONFIGURATION = {
    className: 'org.apache.ignite.configuration.ConnectorConfiguration',
    fields: {
        jettyPath: null,
        host: null,
        port: {dflt: 11211},
        portRange: {dflt: 100},
        idleTimeout: {dflt: 7000},
        idleQueryCursorTimeout: {dflt: 600000},
        idleQueryCursorCheckFrequency: {dflt: 60000},
        receiveBufferSize: {dflt: 32768},
        sendBufferSize: {dflt: 32768},
        sendQueueLimit: {dflt: 0},
        directBuffer: {dflt: false},
        noDelay: {dflt: true},
        selectorCount: null,
        threadPoolSize: null,
        messageInterceptor: {type: 'bean'},
        secretKey: null,
        sslEnabled: {dflt: false}
    }
};

// Communication configuration code generation descriptor.
$generatorCommon.COMMUNICATION_CONFIGURATION = {
    className: 'org.apache.ignite.spi.communication.tcp.TcpCommunicationSpi',
    fields: {
        listener: {type: 'bean'},
        localAddress: null,
        localPort: {dflt: 47100},
        localPortRange: {dflt: 100},
        sharedMemoryPort: {dflt: 48100},
        directBuffer: {dflt: false},
        directSendBuffer: {dflt: false},
        idleConnectionTimeout: {dflt: 30000},
        connectTimeout: {dflt: 5000},
        maxConnectTimeout: {dflt: 600000},
        reconnectCount: {dflt: 10},
        socketSendBuffer: {dflt: 32768},
        socketReceiveBuffer: {dflt: 32768},
        messageQueueLimit: {dflt: 1024},
        slowClientQueueLimit: null,
        tcpNoDelay: {dflt: true},
        ackSendThreshold: {dflt: 16},
        unacknowledgedMessagesBufferSize: {dflt: 0},
        socketWriteTimeout: {dflt: 2000},
        selectorsCount: null,
        addressResolver: {type: 'bean'}
    }
};

// Communication configuration code generation descriptor.
$generatorCommon.IGFS_IPC_CONFIGURATION = {
    className: 'org.apache.ignite.igfs.IgfsIpcEndpointConfiguration',
    fields: {
        type: {type: 'enum', enumClass: 'org.apache.ignite.igfs.IgfsIpcEndpointType'},
        host: {dflt: '127.0.0.1'},
        port: {dflt: 10500},
        memorySize: {dflt: 262144},
        tokenDirectoryPath: {dflt: 'ipc/shmem'}
    }
};

// Check that cache has datasource.
$generatorCommon.cacheHasDatasource = function(cache) {
    if (cache.cacheStoreFactory && cache.cacheStoreFactory.kind) {
        const storeFactory = cache.cacheStoreFactory[cache.cacheStoreFactory.kind];

        return !!(storeFactory && (storeFactory.connectVia ? (storeFactory.connectVia === 'DataSource' ? storeFactory.dialect : false) : storeFactory.dialect)); // eslint-disable-line no-nested-ternary
    }

    return false;
};

$generatorCommon.secretPropertiesNeeded = function(cluster) {
    return !_.isNil(_.find(cluster.caches, $generatorCommon.cacheHasDatasource)) || cluster.sslEnabled;
};

// Check that binary is configured.
$generatorCommon.binaryIsDefined = function(binary) {
    return binary && ($generatorCommon.isDefinedAndNotEmpty(binary.idMapper) || $generatorCommon.isDefinedAndNotEmpty(binary.nameMapper) ||
        $generatorCommon.isDefinedAndNotEmpty(binary.serializer) || $generatorCommon.isDefinedAndNotEmpty(binary.typeConfigurations) ||
        (!_.isNil(binary.compactFooter) && !binary.compactFooter));
};

// Extract domain model metadata location.
$generatorCommon.domainQueryMetadata = function(domain) {
    return domain.queryMetadata ? domain.queryMetadata : 'Configuration';
};

/**
 * @param {Object} obj Object to check.
 * @param {Array<String>} props Array of properties names.
 * @returns {boolean} 'true' if
 */
$generatorCommon.hasAtLeastOneProperty = function(obj, props) {
    return obj && props && _.findIndex(props, (prop) => !_.isNil(obj[prop])) >= 0;
};

/**
 * Convert some name to valid java name.
 *
 * @param prefix To append to java name.
 * @param name to convert.
 * @returns {string} Valid java name.
 */
$generatorCommon.toJavaName = function(prefix, name) {
    const javaName = name ? name.replace(/[^A-Za-z_0-9]+/g, '_') : 'dflt';

    return prefix + javaName.charAt(0).toLocaleUpperCase() + javaName.slice(1);
};

/**
 * @param v Value to check.
 * @returns {boolean} 'true' if value defined and not empty string.
 */
$generatorCommon.isDefinedAndNotEmpty = function(v) {
    let defined = !_.isNil(v);

    if (defined && (_.isString(v) || _.isArray(v)))
        defined = v.length > 0;

    return defined;
};

/**
 * @param {Object} obj Object to check.
 * @param {Array<String>} props Properties names.
 * @returns {boolean} 'true' if object contains at least one from specified properties.
 */
$generatorCommon.hasProperty = function(obj, props) {
    for (const propName in props) {
        if (props.hasOwnProperty(propName)) {
            if (obj[propName])
                return true;
        }
    }

    return false;
};

/**
 * Get class for selected implementation of Failover SPI.
 *
 * @param spi Failover SPI configuration.
 * @returns {*} Class for selected implementation of Failover SPI.
 */
$generatorCommon.failoverSpiClass = function(spi) {
    switch (spi.kind) {
        case 'JobStealing': return 'org.apache.ignite.spi.failover.jobstealing.JobStealingFailoverSpi';
        case 'Never': return 'org.apache.ignite.spi.failover.never.NeverFailoverSpi';
        case 'Always': return 'org.apache.ignite.spi.failover.always.AlwaysFailoverSpi';
        case 'Custom': return _.get(spi, 'Custom.class');
        default: return 'Unknown';
    }
};

$generatorCommon.loggerConfigured = function(logger) {
    if (logger && logger.kind) {
        const log = logger[logger.kind];

        switch (logger.kind) {
            case 'Log4j2': return log && $generatorCommon.isDefinedAndNotEmpty(log.path);

            case 'Log4j':
                if (!log || !log.mode)
                    return false;

                if (log.mode === 'Path')
                    return $generatorCommon.isDefinedAndNotEmpty(log.path);

                return true;

            case 'Custom': return log && $generatorCommon.isDefinedAndNotEmpty(log.class);

            default:
                return true;
        }
    }

    return false;
};

export default $generatorCommon;
