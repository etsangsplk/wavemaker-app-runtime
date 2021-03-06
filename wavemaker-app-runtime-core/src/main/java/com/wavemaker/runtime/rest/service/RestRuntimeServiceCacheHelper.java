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
package com.wavemaker.runtime.rest.service;

import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.WeakHashMap;

import com.wavemaker.runtime.rest.processor.data.HttpRequestDataProcessor;
import com.wavemaker.runtime.rest.processor.data.XWMPrefixDataProcessor;
import com.wavemaker.runtime.rest.processor.request.HttpRequestProcessor;
import com.wavemaker.runtime.rest.processor.request.PassDefaultHeadersRequestProcessor;
import com.wavemaker.runtime.rest.processor.response.HttpResponseProcessor;
import com.wavemaker.runtime.rest.processor.response.PrefixHttpResponseHeadersResponseProcessor;
import com.wavemaker.runtime.rest.processor.response.UpdateCookiePathHttpResponseProcessor;
import com.wavemaker.commons.json.JSONUtils;
import com.wavemaker.commons.util.IOUtils;
import com.wavemaker.tools.apidocs.tools.core.model.Swagger;

/**
 * @author Uday Shankar
 */
public class RestRuntimeServiceCacheHelper {

    private Map<String, Swagger> serviceIdVsSwaggerCache = new WeakHashMap<String, Swagger>();

    private Map<String, List<HttpResponseProcessor>> serviceIdVsHttpResponseProcessorsCache = new WeakHashMap<>();

    public Swagger getSwaggerDoc(String serviceId) throws IOException {
        if (!serviceIdVsSwaggerCache.containsKey(serviceId)) {
            InputStream stream = null;
            try {
                stream = Thread.currentThread().getContextClassLoader().getResourceAsStream(serviceId + "_apiTarget.json");
                Swagger swaggerDoc = JSONUtils.toObject(stream, Swagger.class);
                serviceIdVsSwaggerCache.put(serviceId, swaggerDoc);
            } finally {
                IOUtils.closeSilently(stream);
            }
        }
        return serviceIdVsSwaggerCache.get(serviceId);
    }

    public List<HttpRequestDataProcessor> getHttpRequestDataProcessors(String serviceId) {
        List<HttpRequestDataProcessor> httpRequestDataProcessors = new ArrayList<>();
        httpRequestDataProcessors.add(new XWMPrefixDataProcessor());
        return httpRequestDataProcessors;
    }

    public List<HttpRequestProcessor> getHttpRequestProcessors(String serviceId) {
        List<HttpRequestProcessor> httpRequestProcessors = new ArrayList<>();
        httpRequestProcessors.add(new PassDefaultHeadersRequestProcessor());
        return httpRequestProcessors;
    }

    public List<HttpResponseProcessor> getHttpResponseProcessors(String serviceId) {
        List<HttpResponseProcessor> httpResponseProcessors = new ArrayList<>();
        httpResponseProcessors.add(new UpdateCookiePathHttpResponseProcessor());
        httpResponseProcessors.add(new PrefixHttpResponseHeadersResponseProcessor());
        return httpResponseProcessors;
    }
}
