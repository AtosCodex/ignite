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

import angular from 'angular';

import ConfigurationSummaryCtrl from './summary/summary.controller';
import ConfigurationSummaryResource from './summary/summary.resource';

angular
.module('ignite-console.states.configuration', [
    'ui.router'
])
// Services.
.service(...ConfigurationSummaryResource)
.config(['$stateProvider', function($stateProvider) {
    // Setup the states.
    $stateProvider
    .state('base.configuration', {
        url: '/configuration',
        templateUrl: '/configuration/sidebar.html'
    })
    .state('base.configuration.clusters', {
        url: '/clusters',
        templateUrl: '/configuration/clusters.html',
        data: {
            loading: 'Loading clusters screen...'
        },
        resolve: {
            $title: () => {
                return 'Configure Clusters - Ignite Console';
            }
        }
    })
    .state('base.configuration.caches', {
        url: '/caches',
        templateUrl: '/configuration/caches.html',
        data: {
            loading: 'Loading caches screen...'
        },
        resolve: {
            $title: () => {
                return 'Configure Caches - Ignite Console';
            }
        }
    })
    .state('base.configuration.domains', {
        url: '/domains',
        templateUrl: '/configuration/domains.html',
        data: {
            loading: 'Loading domain models screen...'
        },
        resolve: {
            $title: () => {
                return 'Configure Domain Models - Ignite Console';
            }
        }
    })
    .state('base.configuration.igfs', {
        url: '/igfs',
        templateUrl: '/configuration/igfs.html',
        data: {
            loading: 'Loading IGFS screen...'
        },
        resolve: {
            $title: () => {
                return 'Configure IGFS - Ignite Console';
            }
        }
    })
    .state('base.configuration.summary', {
        url: '/summary',
        templateUrl: '/configuration/summary.html',
        controller: ConfigurationSummaryCtrl,
        controllerAs: 'ctrl',
        data: {
            loading: 'Loading summary screen...'
        },
        resolve: {
            $title: () => {
                return 'Configurations Summary - Ignite Console';
            }
        }
    });
}]);
