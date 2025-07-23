if(NOT TARGET react-native-reanimated::reanimated)
add_library(react-native-reanimated::reanimated SHARED IMPORTED)
set_target_properties(react-native-reanimated::reanimated PROPERTIES
    IMPORTED_LOCATION "/Users/rgarlapallay/Desktop/Workspace/ReactPractice_K/CrusherMate/node_modules/react-native-reanimated/android/build/intermediates/cxx/RelWithDebInfo/2s4k6x3n/obj/armeabi-v7a/libreanimated.so"
    INTERFACE_INCLUDE_DIRECTORIES "/Users/rgarlapallay/Desktop/Workspace/ReactPractice_K/CrusherMate/node_modules/react-native-reanimated/android/build/prefab-headers/reanimated"
    INTERFACE_LINK_LIBRARIES ""
)
endif()

if(NOT TARGET react-native-reanimated::worklets)
add_library(react-native-reanimated::worklets SHARED IMPORTED)
set_target_properties(react-native-reanimated::worklets PROPERTIES
    IMPORTED_LOCATION "/Users/rgarlapallay/Desktop/Workspace/ReactPractice_K/CrusherMate/node_modules/react-native-reanimated/android/build/intermediates/cxx/RelWithDebInfo/2s4k6x3n/obj/armeabi-v7a/libworklets.so"
    INTERFACE_INCLUDE_DIRECTORIES "/Users/rgarlapallay/Desktop/Workspace/ReactPractice_K/CrusherMate/node_modules/react-native-reanimated/android/build/prefab-headers/worklets"
    INTERFACE_LINK_LIBRARIES ""
)
endif()

